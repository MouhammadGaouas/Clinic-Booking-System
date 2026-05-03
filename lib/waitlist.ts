import { prisma } from "@/lib/prisma";
import { sendAppointmentConfirmation } from "@/lib/mail";

// Called when an appointment is cancelled — promote first waitlist entry
export async function promoteWaitlist(doctorId: string, slotId: string) {
  const next = await prisma.waitlist.findFirst({
    where: { doctorId, status: "WAITING" },
    orderBy: { createdAt: "asc" },
  });
  if (!next) return;

  await prisma.$transaction(async (tx) => {
    await tx.waitlist.update({ where: { id: next.id }, data: { status: "PROMOTED" } });
    await tx.appointment.create({
      data: {
        slotId,
        doctorId,
        patientName: next.patientName,
        patientEmail: next.patientEmail,
        status: "PENDING",
      },
    });
    await tx.slot.update({ where: { id: slotId }, data: { isBooked: true } });
  });

  await sendAppointmentConfirmation(next.patientEmail, {
    patientName: next.patientName,
    doctorName: "your doctor",
    dateTime: "TBC",
    appointmentId: next.id,
  });
}
