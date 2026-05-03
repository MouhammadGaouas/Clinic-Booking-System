import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: {
      clinic: { select: { name: true, address: true, phone: true } },
    },
  });

  if (!doctor) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }

  return NextResponse.json(doctor);
}
