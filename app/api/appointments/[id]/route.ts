import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Status = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
const validTransitions: Record<Status, Status[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  CANCELLED: [],
  COMPLETED: [],
};

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { status }: { status: Status } = await req.json();
  const resolvedParams = await params;
  const appt = await prisma.appointment.findUnique({ where: { id: resolvedParams.id } });
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!validTransitions[appt.status as Status].includes(status)) {
    return NextResponse.json({ error: `Cannot transition from ${appt.status} to ${status}` }, { status: 400 });
  }

  const updated = await prisma.appointment.update({
    where: { id: resolvedParams.id },
    data: { status },
  });

  if (status === "CANCELLED" && appt.status !== "CANCELLED") {
      const { promoteWaitlist } = await import("@/lib/waitlist");
      await promoteWaitlist(appt.doctorId, appt.slotId);
  }

  return NextResponse.json(updated);
}
