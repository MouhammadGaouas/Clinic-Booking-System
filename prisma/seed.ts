import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const clinic = await prisma.clinic.create({
    data: {
      name: "City Medical Centre",
      address: "12 Health Street, Algiers",
      phone: "+213 555 0100",
      openHours: { mon: "08:00-17:00", tue: "08:00-17:00", wed: "08:00-17:00" },
    },
  });

  // BetterAuth uses bcrypt or a similar hash for passwords if using email/password.
  // We'll create a user and manually create a password account for them.
  // The actual hashing algorithm depends on BetterAuth config, but bcryptjs is commonly used or accepted.
  // To keep it simple, we create a user. BetterAuth typically stores the password directly in the account model using its own hashing.
  // If we just need a dummy user for the DB relations without actually logging in, any hashed string works.
  
  const hashedPassword = await bcrypt.hash("password123", 12);

  const doctorUserId = "user-doctor-1";
  const doctorUser = await prisma.user.create({
    data: {
      id: doctorUserId,
      name: "Dr. Amina Belkacem",
      email: "doctor@medapp.dz",
      role: "DOCTOR",
      emailVerified: true,
      accounts: {
        create: {
          id: "account-doctor-1",
          accountId: "email",
          providerId: "credential",
          password: hashedPassword,
        }
      }
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

  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
