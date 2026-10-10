import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { logAudit } from "@/lib/audit";
import { parseCsv } from "@/lib/csv";

type CsvRow = {
  Name?: string;
  "IUB ID"?: string;
  "Registration Number"?: string;
  Semester?: string;
  Section?: string;
  Email?: string;
  Phone?: string;
};

export async function POST(req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  if (!body?.csvText || typeof body.csvText !== "string") {
    return NextResponse.json({ error: "Missing csvText" }, { status: 400 });
  }

  const rows = parseCsv<CsvRow>(body.csvText);
  const successful: string[] = [];
  const duplicates: string[] = [];
  const invalid: { row: number; reason: string }[] = [];
  const seenIubIds = new Set<string>();
  const seenRegNumbers = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const fullName = (r.Name || "").trim();
    const iubId = (r["IUB ID"] || "").trim();
    const regNumber = (r["Registration Number"] || "").trim();
    const semester = (r.Semester || "").trim();
    const section = (r.Section || "5th-4M").trim() || "5th-4M";
    const email = (r.Email || "").trim();
    const phone = (r.Phone || "").trim();

    if (!fullName || !iubId || !regNumber || !semester) {
      invalid.push({ row: i + 2, reason: "Missing required field (Name, IUB ID, Registration Number, or Semester)" });
      continue;
    }

    // Detect duplicate identifiers inside the CSV before attempting database writes.
    const normalizedIubId = iubId.toLowerCase();
    const normalizedRegNumber = regNumber.toLowerCase();
    if (seenIubIds.has(normalizedIubId) || seenRegNumbers.has(normalizedRegNumber)) {
      duplicates.push(`${fullName} (${iubId}) — duplicate identifier in CSV`);
      continue;
    }
    seenIubIds.add(normalizedIubId);
    seenRegNumbers.add(normalizedRegNumber);

    try {
      const existingStudent = await prisma.student.findFirst({
        where: { OR: [{ iubId }, { regNumber }] },
        select: { id: true },
      });
      if (existingStudent) {
        duplicates.push(`${fullName} (${iubId}) — student already exists`);
        continue;
      }

      // A login account can exist even if its Student profile was deleted or never linked.
      const existingUser = await prisma.user.findUnique({ where: { loginId: iubId } });
      if (existingUser && (existingUser.role !== "STUDENT" || existingUser.studentId)) {
        duplicates.push(`${fullName} (${iubId}) — login ID is already assigned to another account`);
        continue;
      }

      const passwordHash = await bcrypt.hash(regNumber, 12);
      await prisma.$transaction(async (tx) => {
        const student = await tx.student.create({
          data: {
            fullName,
            iubId,
            regNumber,
            semester,
            section,
            email: email || undefined,
            phone: phone || undefined,
          },
        });

        if (existingUser) {
          // Reconnect an unlinked STUDENT account without overwriting its password.
          await tx.user.update({
            where: { id: existingUser.id },
            data: { studentId: student.id, isActive: true },
          });
        } else {
          await tx.user.create({
            data: {
              role: "STUDENT",
              loginId: iubId,
              passwordHash,
              studentId: student.id,
            },
          });
        }
      });
      successful.push(`${fullName} (${iubId})`);
    } catch (e: unknown) {
      // Prisma P2002 means a unique field (usually loginId, iubId, or regNumber) collided.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        duplicates.push(`${fullName} (${iubId}) — login ID, IUB ID, or registration number already exists`);
      } else {
        const reason = e instanceof Error ? e.message : "unknown database error";
        invalid.push({ row: i + 2, reason: `Database error: ${reason}` });
      }
    }
  }

  await logAudit({
    userId: session!.user.id,
    action: "STUDENTS_IMPORTED",
    affectedType: "Student",
    details: `CSV import: ${successful.length} added, ${duplicates.length} duplicates, ${invalid.length} invalid`,
  });

  return NextResponse.json({ successful, duplicates, invalid, totalRows: rows.length });
}
