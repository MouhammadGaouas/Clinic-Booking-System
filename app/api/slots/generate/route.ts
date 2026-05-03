import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { addMinutes, setHours, setMinutes, startOfDay, addDays } from "date-fns";

const schema = z.object({
  doctorId: z.string(),
  startDate: z.string(), // ISO date string e.g. "2026-05-01"
  endDate: z.string(),
  slotDurationMinutes: z.number().min(10).max(120).default(30),
  startHour: z.number().min(0).max(23).default(8),
  endHour: z.number().min(1).max(24).default(17),
});

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== "DOCTOR" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { doctorId, startDate, endDate, slotDurationMinutes, startHour, endHour } = parsed.data;

  // Verify doctor exists
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }

  const start = startOfDay(new Date(startDate));
  const end = startOfDay(new Date(endDate));
  const slotsToCreate: { startTime: Date; endTime: Date; doctorId: string }[] = [];

  let currentDay = start;
  while (currentDay <= end) {
    let slotStart = setMinutes(setHours(currentDay, startHour), 0);
    const dayEnd = setMinutes(setHours(currentDay, endHour), 0);

    while (slotStart < dayEnd) {
      const slotEnd = addMinutes(slotStart, slotDurationMinutes);
      if (slotEnd <= dayEnd) {
        slotsToCreate.push({
          startTime: slotStart,
          endTime: slotEnd,
          doctorId,
        });
      }
      slotStart = slotEnd;
    }

    currentDay = addDays(currentDay, 1);
  }

  const created = await prisma.slot.createMany({
    data: slotsToCreate,
    skipDuplicates: true,
  });

  return NextResponse.json(
    { message: `Created ${created.count} slots`, count: created.count },
    { status: 201 }
  );
}
