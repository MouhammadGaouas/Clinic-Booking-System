import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const waitlistSchema = z.object({
  doctorId: z.string(),
  patientName: z.string().min(2),
  patientEmail: z.string().email(),
});

// GET /api/waitlist — list waitlist entries
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const doctorId = searchParams.get("doctorId");

  const entries = await prisma.waitlist.findMany({
    where: {
      ...(doctorId ? { doctorId } : {}),
      status: "WAITING",
    },
    include: { doctor: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(entries);
}

// POST /api/waitlist — add to waitlist
export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { doctorId, patientName, patientEmail } = parsed.data;

  // Security check: email must match session
  if (patientEmail.toLowerCase() !== session.user.email.toLowerCase()) {
    return NextResponse.json({ error: "Forbidden: You can only join the waitlist with your own email address." }, { status: 403 });
  }

  const entry = await prisma.waitlist.create({
    data: {
      doctorId,
      patientName,
      patientEmail,
      status: "WAITING",
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
