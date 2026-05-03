import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const specialty = searchParams.get("specialty");

  const doctors = await prisma.doctor.findMany({
    where: {
      isActive: true,
      ...(specialty ? { specialty: { contains: specialty, mode: "insensitive" as const } } : {}),
    },
    include: {
      clinic: { select: { name: true, address: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(doctors);
}
