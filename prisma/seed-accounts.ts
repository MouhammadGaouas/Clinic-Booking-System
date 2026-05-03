import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";

async function main() {
  // Create Doctor user via better-auth API
  const doctorUser = await auth.api.createUser({
    body: {
      email: "doctor@midcare.test",
      password: "doctor123",
      name: "Dr. Amina Belkacem",
      role: "DOCTOR",
    },
  });
  console.log("✅ Doctor created:", doctorUser.email, "| role:", doctorUser.role);

  // Link doctor user to existing Doctor profile (if exists)
  const doctorProfile = await prisma.doctor.findFirst({
    where: { name: "Dr. Amina Belkacem" },
  });
  if (doctorProfile) {
    await prisma.doctor.update({
      where: { id: doctorProfile.id },
      data: { userId: doctorUser.id },
    });
    console.log("✅ Doctor profile linked");
  }

  // Create Admin user via better-auth API
  const adminUser = await auth.api.createUser({
    body: {
      email: "admin@midcare.test",
      password: "admin123",
      name: "Admin User",
      role: "ADMIN",
    },
  });
  console.log("✅ Admin created:", adminUser.email, "| role:", adminUser.role);

  await prisma.$disconnect();
  console.log("\n🎉 Done! Test accounts:");
  console.log("  Doctor: doctor@midcare.test / doctor123");
  console.log("  Admin:  admin@midcare.test  / admin123");
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
