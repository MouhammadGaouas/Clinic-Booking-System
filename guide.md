# Medical Appointment System — Implementation Guide

> **Stack:** Next.js 16 (with Proxy) · Tailwind CSS · Prisma ORM · PostgreSQL (local)
> **Scope:** Doctors & Clinics
> **Timeline:** ~16 weeks across 4 phases

---

## Table of Contents

1. [Tech Stack Overview](#tech-stack-overview)
2. [Project Setup](#project-setup)
3. [Phase 1 — Foundation & Data Layer (Weeks 1–3)](#phase-1--foundation--data-layer-weeks-13)
4. [Phase 2 — Core Appointment Engine (Weeks 4–8)](#phase-2--core-appointment-engine-weeks-48)
5. [Phase 3 — Clinic & Doctor Management (Weeks 9–13)](#phase-3--clinic--doctor-management-weeks-913)
6. [Phase 4 — Polish, Testing & Deploy (Weeks 14–16)](#phase-4--polish-testing--deploy-weeks-1416)
7. [Prisma Data Models](#prisma-data-models)
8. [API Routes Reference](#api-routes-reference)
9. [Proxy Configuration (Next.js 16)](#proxy-configuration-nextjs-16)
10. [Folder Structure](#folder-structure)

---

## Tech Stack Overview

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 16 (App Router) | Full-stack React, SSR, API routes |
| Styling | Tailwind CSS | Utility-first UI |
| ORM | Prisma | Type-safe DB access |
| Database | PostgreSQL (local) | Relational data store |
| Auth | NextAuth.js | Session, RBAC |
| Validation | Zod + React Hook Form | Input validation |
| Notifications | Nodemailer | Email reminders |
| Dates | date-fns | Date/time utilities |
| Language | TypeScript | End-to-end type safety |
| Testing | Vitest + Playwright | Unit + E2E |

---

## Project Setup

### 1. Bootstrap the app

```bash
npx create-next-app@latest medapp \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd medapp
```

### 2. Install dependencies

```bash
# Runtime
npm install prisma @prisma/client \
  next-auth \
  bcryptjs \
  date-fns \
  zod \
  react-hook-form \
  @hookform/resolvers \
  nodemailer \
  http-proxy-middleware

# Dev
npm install -D \
  @types/bcryptjs \
  @types/nodemailer \
  @types/node \
  vitest \
  @testing-library/react \
  @testing-library/user-event \
  @vitejs/plugin-react \
  playwright
```

### 3. Initialize Prisma

```bash
npx prisma init
# Creates: prisma/schema.prisma and .env with DATABASE_URL
```

### 4. Configure local PostgreSQL

```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Create database
psql -U postgres -c "CREATE DATABASE medapp;"
```

`.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/medapp"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT="587"
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-pass"
```

---

## Phase 1 — Foundation & Data Layer (Weeks 1–3)

### Goals

- Working Next.js 16 app with Tailwind
- Prisma schema migrated and seeded
- NextAuth.js authentication with RBAC
- Proxy configured for the Next.js 16 App Router

### Tasks

#### 1.1 Prisma schema

Create `prisma/schema.prisma` (see [Prisma Data Models](#prisma-data-models) section).

```bash
npx prisma migrate dev --name init
npx prisma generate
```

#### 1.2 Prisma client singleton

`src/lib/prisma.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

> **Critical:** without this singleton, Next.js hot-reload will exhaust the PostgreSQL connection pool in development.

#### 1.3 NextAuth.js setup

`src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).role = token.role;
      return session;
    },
  },
  pages: { signIn: "/login" },
});

export { handler as GET, handler as POST };
```

#### 1.4 Middleware RBAC guard

`src/middleware.ts`:

```typescript
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (path.startsWith("/clinic") && token?.role !== "CLINIC_ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    if (path.startsWith("/doctor") && token?.role !== "DOCTOR") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    return NextResponse.next();
  },
  { callbacks: { authorized: ({ token }) => !!token } }
);

export const config = {
  matcher: ["/clinic/:path*", "/doctor/:path*", "/api/appointments/:path*"],
};
```

#### 1.5 Seed script

`prisma/seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const clinic = await prisma.clinic.create({
    data: {
      name: "City Medical Centre",
      address: "12 Health Street, Algiers",
      phone: "+213 555 0100",
      openHours: { mon: "08:00-17:00", tue: "08:00-17:00", wed: "08:00-17:00" },
    },
  });

  const doctorUser = await prisma.user.create({
    data: {
      email: "doctor@medapp.dz",
      password: await bcrypt.hash("password123", 12),
      role: "DOCTOR",
    },
  });

  await prisma.doctor.create({
    data: {
      name: "Dr. Amina Belkacem",
      specialty: "General Practice",
      bio: "10 years of experience in general medicine.",
      clinicId: clinic.id,
      userId: doctorUser.id,
    },
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

```bash
# package.json
"prisma": { "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts" }

npx prisma db seed
```

### Phase 1 Deliverables

- [ ] Running Next.js 16 app
- [ ] Prisma schema migrated to local PostgreSQL
- [ ] NextAuth.js working with CLINIC_ADMIN and DOCTOR roles
- [ ] Middleware protecting routes by role
- [ ] Database seeded with sample data
- [ ] Proxy configured (see [Proxy Configuration](#proxy-configuration-nextjs-16))

---

## Phase 2 — Core Appointment Engine (Weeks 4–8)

### Goals

- Booking API with slot conflict prevention
- Doctor schedule and availability management
- Appointment calendar UI for doctors
- Clinic-wide appointment table

### Tasks

#### 2.1 Booking API — POST /api/appointments

`src/app/api/appointments/route.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  slotId: z.string().cuid(),
  doctorId: z.string().cuid(),
  patientName: z.string().min(2),
  patientEmail: z.string().email(),
  reason: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { slotId, doctorId, patientName, patientEmail, reason } = parsed.data;

  // Atomic slot booking — prevents double-booking
  try {
    const appointment = await prisma.$transaction(async (tx) => {
      const slot = await tx.slot.findUnique({ where: { id: slotId } });
      if (!slot || slot.isBooked) {
        throw new Error("Slot unavailable");
      }
      await tx.slot.update({ where: { id: slotId }, data: { isBooked: true } });
      return tx.appointment.create({
        data: { slotId, doctorId, patientName, patientEmail, reason, status: "PENDING" },
      });
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
```

#### 2.2 Slot availability API — GET /api/slots

`src/app/api/slots/route.ts`:

```typescript
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
```

#### 2.3 Appointment status transitions

```typescript
// PUT /api/appointments/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Status = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
const validTransitions: Record<Status, Status[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  CANCELLED: [],
  COMPLETED: [],
};

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { status }: { status: Status } = await req.json();
  const appt = await prisma.appointment.findUnique({ where: { id: params.id } });
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!validTransitions[appt.status as Status].includes(status)) {
    return NextResponse.json({ error: `Cannot transition from ${appt.status} to ${status}` }, { status: 400 });
  }

  const updated = await prisma.appointment.update({
    where: { id: params.id },
    data: { status },
  });
  return NextResponse.json(updated);
}
```

#### 2.4 Doctor dashboard page

`src/app/(doctor)/dashboard/page.tsx`:

```typescript
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DoctorDashboard() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const doctor = await prisma.doctor.findFirst({
    where: { user: { email: session.user?.email! } },
    include: {
      appointments: {
        include: { slot: true },
        orderBy: { slot: { startTime: "asc" } },
        take: 20,
      },
    },
  });

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Welcome, {doctor?.name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Today's appointments" value={doctor?.appointments.length ?? 0} />
      </div>
      {/* Appointment list/calendar component */}
    </main>
  );
}
```

### Phase 2 Deliverables

- [ ] POST /api/appointments with atomic conflict check
- [ ] GET /api/slots with date filtering
- [ ] Status transition logic (PENDING → CONFIRMED → COMPLETED)
- [ ] Doctor dashboard page (SSR with Prisma)
- [ ] Clinic appointment table with filters
- [ ] Zod validation on all API inputs

---

## Phase 3 — Clinic & Doctor Management (Weeks 9–13)

### Goals

- Doctor CRUD (create, edit, deactivate)
- Clinic settings (hours, capacity)
- Email notifications via Nodemailer
- Doctor search with specialty filter
- Analytics dashboard with Prisma aggregations
- Waitlist module

### Tasks

#### 3.1 Nodemailer email service

`src/lib/mail.ts`:

```typescript
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function sendAppointmentConfirmation(to: string, data: {
  patientName: string;
  doctorName: string;
  dateTime: string;
  appointmentId: string;
}) {
  await transporter.sendMail({
    from: '"MedApp" <noreply@medapp.dz>',
    to,
    subject: "Appointment Confirmed",
    html: `
      <h2>Appointment Confirmed</h2>
      <p>Hello ${data.patientName},</p>
      <p>Your appointment with <strong>${data.doctorName}</strong> is confirmed for <strong>${data.dateTime}</strong>.</p>
      <p>Reference: ${data.appointmentId}</p>
    `,
  });
}

export async function sendAppointmentReminder(to: string, data: {
  patientName: string;
  doctorName: string;
  dateTime: string;
}) {
  await transporter.sendMail({
    from: '"MedApp" <noreply@medapp.dz>',
    to,
    subject: "Appointment Reminder — Tomorrow",
    html: `
      <h2>Reminder</h2>
      <p>Hello ${data.patientName}, this is a reminder of your appointment with <strong>${data.doctorName}</strong> tomorrow at <strong>${data.dateTime}</strong>.</p>
    `,
  });
}
```

#### 3.2 Analytics API

`src/app/api/clinic/analytics/route.ts`:

```typescript
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
```

#### 3.3 Waitlist module

`src/app/api/waitlist/route.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
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
```

### Phase 3 Deliverables

- [ ] Doctor CRUD pages (list, create, edit, deactivate)
- [ ] Clinic settings page (opening hours, max capacity)
- [ ] Email confirmation and 24h reminder via Nodemailer
- [ ] Doctor search filtered by specialty and availability
- [ ] Analytics dashboard (Prisma aggregations)
- [ ] Waitlist with auto-promote on cancellation

---

## Phase 4 — Polish, Testing & Deploy (Weeks 14–16)

### Goals

- Unit tests with Vitest
- E2E tests with Playwright
- Performance optimization (RSC, Suspense, caching)
- Security hardening
- Production deployment

### Tasks

#### 4.1 Vitest unit tests

`src/app/api/appointments/__tests__/booking.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    slot: { findUnique: vi.fn(), update: vi.fn() },
    appointment: { create: vi.fn() },
  },
}));

describe("Booking API", () => {
  it("rejects booking when slot is already taken", async () => {
    // test implementation
  });
});
```

#### 4.2 Playwright E2E

`tests/booking.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test("doctor can confirm an appointment", async ({ page }) => {
  await page.goto("/login");
  await page.fill('[name="email"]', "doctor@medapp.dz");
  await page.fill('[name="password"]', "password123");
  await page.click('[type="submit"]');
  await expect(page).toHaveURL("/doctor/dashboard");
  await expect(page.locator("h1")).toContainText("Welcome");
});
```

#### 4.3 next.config.ts optimizations

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
  images: {
    domains: ["localhost"],
  },
};

export default nextConfig;
```

#### 4.4 Security headers

`src/middleware.ts` (extend existing middleware):

```typescript
import { NextResponse } from "next/server";

// Add to middleware response
const response = NextResponse.next();
response.headers.set("X-Frame-Options", "DENY");
response.headers.set("X-Content-Type-Options", "nosniff");
response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
```

#### 4.5 Production deployment checklist

```bash
# Run all migrations on production DB
npx prisma migrate deploy

# Build
npm run build

# Start production server
npm start

# Or with PM2
pm2 start npm --name "medapp" -- start
```

### Phase 4 Deliverables

- [ ] Vitest unit tests for all API routes
- [ ] Playwright E2E covering login, booking, and status change flows
- [ ] Production build passing with no TypeScript errors
- [ ] Security headers configured
- [ ] Deployed to VPS or Vercel with production DATABASE_URL

---

## Prisma Data Models

`prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// --- Enums ---

enum Role {
  CLINIC_ADMIN
  DOCTOR
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
}

enum NotifType {
  CONFIRMATION
  REMINDER
}

enum NotifStatus {
  PENDING
  SENT
  FAILED
}

// --- Models ---

model Clinic {
  id        String   @id @default(cuid())
  name      String
  address   String
  phone     String
  openHours Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  doctors   Doctor[]
  users     User[]
}

model Doctor {
  id        String   @id @default(cuid())
  name      String
  specialty String
  bio       String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  clinicId String
  clinic   Clinic @relation(fields: [clinicId], references: [id])

  userId String @unique
  user   User   @relation(fields: [userId], references: [id])

  slots        Slot[]
  appointments Appointment[]
  waitlist     Waitlist[]
}

model Slot {
  id        String   @id @default(cuid())
  startTime DateTime
  endTime   DateTime
  isBooked  Boolean  @default(false)
  createdAt DateTime @default(now())

  doctorId String
  doctor   Doctor @relation(fields: [doctorId], references: [id])

  appointment Appointment?
}

model Appointment {
  id           String            @id @default(cuid())
  patientName  String
  patientEmail String
  reason       String?
  status       AppointmentStatus @default(PENDING)
  notes        String?
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt

  doctorId String
  doctor   Doctor @relation(fields: [doctorId], references: [id])

  slotId String @unique
  slot   Slot   @relation(fields: [slotId], references: [id])

  notifications Notification[]
}

model Waitlist {
  id           String   @id @default(cuid())
  patientName  String
  patientEmail String
  status       String   @default("WAITING")
  createdAt    DateTime @default(now())

  doctorId String
  doctor   Doctor @relation(fields: [doctorId], references: [id])
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  role      Role
  createdAt DateTime @default(now())

  clinicId String?
  clinic   Clinic? @relation(fields: [clinicId], references: [id])

  doctor Doctor?
}

model Notification {
  id     String      @id @default(cuid())
  type   NotifType
  status NotifStatus @default(PENDING)
  sentAt DateTime?
  email  String

  appointmentId String
  appointment   Appointment @relation(fields: [appointmentId], references: [id])
}
```

---

## API Routes Reference

### Appointments

| Method | Route | Description |
|---|---|---|
| GET | `/api/appointments` | List appointments (filter by doctorId, status) |
| POST | `/api/appointments` | Create appointment (atomic slot lock) |
| GET | `/api/appointments/[id]` | Get single appointment |
| PUT | `/api/appointments/[id]` | Update status |
| DELETE | `/api/appointments/[id]` | Cancel appointment |

### Doctors & Slots

| Method | Route | Description |
|---|---|---|
| GET | `/api/doctors` | List doctors (filter by specialty) |
| POST | `/api/doctors` | Create doctor |
| GET | `/api/doctors/[id]` | Get doctor profile |
| PUT | `/api/doctors/[id]` | Update doctor |
| GET | `/api/slots` | Available slots by doctorId + date |
| POST | `/api/slots/generate` | Generate slots for a date range |

### Clinic

| Method | Route | Description |
|---|---|---|
| GET | `/api/clinic` | Get clinic details |
| PUT | `/api/clinic/settings` | Update opening hours, capacity |
| GET | `/api/clinic/analytics` | Aggregated appointment stats |
| GET | `/api/waitlist` | List waitlist entries |

### Auth & Notifications

| Method | Route | Description |
|---|---|---|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth.js handler |
| POST | `/api/auth/register` | Register clinic admin or doctor |
| POST | `/api/notifications/send` | Trigger email send |

---

## Proxy Configuration (Next.js 16)

Next.js 16 uses the App Router and no longer supports `rewrites()` in `next.config.ts` for proxying to a separate backend in all scenarios. The recommended approach is a **custom API route proxy** using `http-proxy-middleware`, or the native `fetch` relay pattern.

### Option A — Custom proxy route (recommended)

Create `src/app/api/proxy/[...path]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

async function handler(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join("/");
  const url = `${BACKEND_URL}/${path}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  headers.set("x-forwarded-host", req.nextUrl.host);
  headers.set("x-forwarded-proto", req.nextUrl.protocol);

  const proxyRes = await fetch(url, {
    method: req.method,
    headers,
    body: ["GET", "HEAD"].includes(req.method) ? undefined : await req.arrayBuffer(),
    // @ts-ignore — Next.js 16 fetch supports duplex
    duplex: "half",
  });

  const body = await proxyRes.arrayBuffer();

  return new NextResponse(body, {
    status: proxyRes.status,
    headers: proxyRes.headers,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
```

Add `BACKEND_URL` to `.env`:

```env
BACKEND_URL="http://localhost:4000"
```

All requests to `/api/proxy/*` are forwarded to your backend. Example: a request to `/api/proxy/external/reports` proxies to `http://localhost:4000/external/reports`.

### Option B — next.config.ts rewrites (simple cases)

For simple path forwarding with no request body manipulation:

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/external/:path*",
        destination: "http://localhost:4000/:path*",
      },
    ];
  },
};

export default nextConfig;
```

> Use Option A when you need auth header injection, body transformation, or streaming. Use Option B for static path forwarding only.

### Option C — http-proxy-middleware in a custom server

If running a custom `server.ts` (Node.js), you can use `http-proxy-middleware`:

```typescript
// server.ts
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = next({ dev: process.env.NODE_ENV !== "production" });
const handle = app.getRequestHandler();

const proxy = createProxyMiddleware({
  target: "http://localhost:4000",
  changeOrigin: true,
  pathFilter: "/api/external",
});

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    if (parsedUrl.pathname?.startsWith("/api/external")) {
      proxy(req, res, () => {});
    } else {
      handle(req, res, parsedUrl);
    }
  }).listen(3000, () => {
    console.log("> Ready on http://localhost:3000");
  });
});
```

> Option C is only needed when proxying WebSocket connections or when the Next.js built-in server doesn't fit your deployment model.

---

## Folder Structure

```
medapp/
├── prisma/
│   ├── schema.prisma          # All Prisma models
│   ├── seed.ts                # Seed script
│   └── migrations/            # Auto-generated by prisma migrate
│
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   │
│   │   ├── (clinic)/
│   │   │   ├── layout.tsx           # Clinic admin layout
│   │   │   ├── appointments/page.tsx
│   │   │   ├── doctors/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   └── settings/page.tsx
│   │   │
│   │   ├── (doctor)/
│   │   │   ├── layout.tsx           # Doctor layout
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── schedule/page.tsx
│   │   │   └── appointments/page.tsx
│   │   │
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── appointments/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   ├── slots/
│   │   │   │   ├── route.ts
│   │   │   │   └── generate/route.ts
│   │   │   ├── doctors/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   ├── clinic/
│   │   │   │   ├── route.ts
│   │   │   │   ├── analytics/route.ts
│   │   │   │   └── settings/route.ts
│   │   │   ├── notifications/route.ts
│   │   │   ├── waitlist/route.ts
│   │   │   └── proxy/[...path]/route.ts   # Next.js 16 proxy
│   │   │
│   │   ├── globals.css
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   ├── ui/                       # Reusable Tailwind components
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Table.tsx
│   │   ├── appointments/
│   │   │   ├── AppointmentCalendar.tsx
│   │   │   ├── AppointmentTable.tsx
│   │   │   └── BookingForm.tsx
│   │   └── clinic/
│   │       ├── DoctorCard.tsx
│   │       └── ClinicStats.tsx
│   │
│   ├── lib/
│   │   ├── prisma.ts              # PrismaClient singleton
│   │   ├── mail.ts                # Nodemailer transporter
│   │   └── auth.ts                # NextAuth options
│   │
│   ├── types/
│   │   └── index.ts               # Shared TypeScript types
│   │
│   └── middleware.ts              # RBAC + auth guard
│
├── tests/
│   ├── booking.spec.ts            # Playwright E2E
│   └── api/
│       └── appointments.test.ts   # Vitest unit
│
├── .env
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Quick Reference Commands

```bash
# Development
npm run dev

# Database
npx prisma migrate dev --name <migration-name>
npx prisma migrate reset          # Reset + re-seed (dev only)
npx prisma db seed
npx prisma studio                 # Visual DB browser

# Testing
npx vitest run                    # Unit tests
npx playwright test               # E2E tests

# Production
npx prisma migrate deploy
npm run build
npm start
```

---

*Generated for the MedApp project — Next.js 16 · Tailwind CSS · Prisma · PostgreSQL (local)*
