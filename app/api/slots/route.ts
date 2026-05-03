import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const doctorId = searchParams.get("doctorId");
  const dateStr = searchParams.get("date");

  if (!doctorId || !dateStr) {
    return NextResponse.json({ error: "doctorId and date required" }, { status: 400 });
  }

  const date = new Date(dateStr);
  const slots = await prisma.slot.findMany({
    where: {
      doctorId,
      isBooked: false,
      startTime: { gte: startOfDay(date), lte: endOfDay(date) },
    },
    orderBy: { startTime: "asc" },
  });
  return NextResponse.json(slots);
}
