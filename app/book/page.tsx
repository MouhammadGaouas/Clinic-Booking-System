import { prisma } from "@/lib/prisma";
import DoctorCard from "@/components/ui/DoctorCard";

export const metadata = {
  title: "Find a Doctor — MidCare",
  description: "Search and book appointments with our qualified doctors.",
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ specialty?: string }>;
}) {
  const { specialty } = await searchParams;

  const doctors = await prisma.doctor.findMany({
    where: {
      isActive: true,
      ...(specialty
        ? { specialty: { contains: specialty, mode: "insensitive" as const } }
        : {}),
    },
    include: {
      clinic: { select: { name: true, address: true } },
    },
    orderBy: { name: "asc" },
  });

  // Get unique specialties for the filter
  const allSpecialties = await prisma.doctor.findMany({
    where: { isActive: true },
    select: { specialty: true },
    distinct: ["specialty"],
    orderBy: { specialty: "asc" },
  });

  return (
    <main
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "40px 24px",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "36px" }}>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 700,
            color: "#18181b",
            margin: "0 0 8px",
            letterSpacing: "-0.02em",
          }}
        >
          Find a Doctor
        </h1>
        <p style={{ fontSize: "16px", color: "#71717a", margin: 0 }}>
          Browse our medical professionals and book an appointment that fits your schedule.
        </p>
      </div>

      {/* Specialty filter */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "32px",
        }}
      >
        <a
          href="/book"
          style={{
            padding: "8px 18px",
            borderRadius: "20px",
            fontSize: "13px",
            fontWeight: 500,
            textDecoration: "none",
            border: !specialty ? "2px solid #3b82f6" : "1.5px solid #e4e4e7",
            background: !specialty ? "#eff6ff" : "#ffffff",
            color: !specialty ? "#1d4ed8" : "#52525b",
            transition: "all 0.15s ease",
          }}
        >
          All Specialties
        </a>
        {allSpecialties.map((s) => (
          <a
            key={s.specialty}
            href={`/book?specialty=${encodeURIComponent(s.specialty)}`}
            style={{
              padding: "8px 18px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: 500,
              textDecoration: "none",
              border:
                specialty === s.specialty
                  ? "2px solid #3b82f6"
                  : "1.5px solid #e4e4e7",
              background: specialty === s.specialty ? "#eff6ff" : "#ffffff",
              color: specialty === s.specialty ? "#1d4ed8" : "#52525b",
              transition: "all 0.15s ease",
            }}
          >
            {s.specialty}
          </a>
        ))}
      </div>

      {/* Doctor grid */}
      {doctors.length === 0 ? (
        <div
          style={{
            padding: "64px 24px",
            textAlign: "center",
            background: "#fafafa",
            borderRadius: "16px",
            border: "1px dashed #e4e4e7",
          }}
        >
          <p style={{ color: "#a1a1aa", fontSize: "16px" }}>
            No doctors found{specialty ? ` for "${specialty}"` : ""}. Try a different filter.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "20px",
          }}
        >
          {doctors.map((doc) => (
            <DoctorCard
              key={doc.id}
              id={doc.id}
              name={doc.name}
              specialty={doc.specialty}
              bio={doc.bio}
              clinicName={doc.clinic.name}
              clinicAddress={doc.clinic.address}
            />
          ))}
        </div>
      )}
    </main>
  );
}
