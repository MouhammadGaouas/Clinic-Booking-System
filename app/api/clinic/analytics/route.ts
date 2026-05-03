import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET() {
  const now = new Date();

  const [total, confirmed, cancelled, completed] = await Promise.all([
    prisma.appointment.count(),
    prisma.appointment.count({ where: { status: "CONFIRMED" } }),
    prisma.appointment.count({ where: { status: "CANCELLED" } }),
    prisma.appointment.count({ where: { status: "COMPLETED" } }),
  ]);

  const thisMonth = await prisma.appointment.count({
    where: {
      slot: { startTime: { gte: startOfMonth(now), lte: endOfMonth(now) } },
    },
  });

  const noShowRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;

  return NextResponse.json({ total, confirmed, cancelled, completed, thisMonth, noShowRate });
}
