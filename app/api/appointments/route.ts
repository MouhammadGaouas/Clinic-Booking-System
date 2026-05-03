import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { sendAppointmentConfirmation } from "@/lib/mail";
import { format } from "date-fns";

const schema = z.object({
  slotId: z.string().cuid(),
  doctorId: z.string().cuid(),
  patientName: z.string().min(2),
  patientEmail: z.string().email(),
  reason: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { slotId, doctorId, patientName, patientEmail, reason } = parsed.data;

  // Security check: email must match session
  if (patientEmail.toLowerCase() !== session.user.email.toLowerCase()) {
    return NextResponse.json({ error: "Forbidden: You can only book for your own email address." }, { status: 403 });
  }

  // Atomic slot booking — prevents double-booking
  try {
    const appointment = await prisma.$transaction(async (tx) => {
      const slot = await tx.slot.findUnique({ where: { id: slotId } });
      if (!slot || slot.isBooked) {
        throw new Error("Slot unavailable");
      }

      const doctor = await tx.doctor.findUnique({ where: { id: doctorId } });
      if (!doctor) throw new Error("Doctor not found");

      await tx.slot.update({ where: { id: slotId }, data: { isBooked: true } });
      
      return tx.appointment.create({
        data: { slotId, doctorId, patientName, patientEmail, reason, status: "PENDING" },
        include: { slot: true, doctor: true }
      });
    });

    // Send confirmation email
    await sendAppointmentConfirmation(appointment.patientEmail, {
      patientName: appointment.patientName,
      doctorName: appointment.doctor.name,
      dateTime: format(appointment.slot.startTime, "PPPPp"),
      appointmentId: appointment.id
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 409 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const doctorId = searchParams.get("doctorId");
  const status = searchParams.get("status");

  const appointments = await prisma.appointment.findMany({
    where: {
      ...(doctorId ? { doctorId } : {}),
      ...(status ? { status: status as any } : {}),
    },
    include: { slot: true, doctor: true },
    orderBy: { slot: { startTime: "asc" } },
  });
  return NextResponse.json(appointments);
}
