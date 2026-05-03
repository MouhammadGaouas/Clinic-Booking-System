import Link from "next/link";

interface DoctorCardProps {
  id: string;
  name: string;
  specialty: string;
  bio?: string | null;
  clinicName?: string;
  clinicAddress?: string;
}

export default function DoctorCard({
  id,
  name,
  specialty,
  bio,
  clinicName,
  clinicAddress,
}: DoctorCardProps) {
  // Generate a stable avatar color from the name
  const hue = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  return (
    <Link href={`/book/${id}`} className="doctor-card-link" style={{ textDecoration: "none" }}>
      <div
        className="doctor-card"
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "24px",
          border: "1px solid #f0f0f0",
          transition: "all 0.25s ease",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          height: "100%",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {/* Avatar */}
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: `linear-gradient(135deg, hsl(${hue}, 65%, 55%) 0%, hsl(${hue + 30}, 65%, 45%) 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "20px",
              fontWeight: 700,
              flexShrink: 0,
              letterSpacing: "-0.02em",
            }}
          >
            {name
              .split(" ")
              .filter((w) => w.length > 0)
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>

          <div style={{ minWidth: 0 }}>
            <h3
              style={{
                fontSize: "17px",
                fontWeight: 600,
                color: "#18181b",
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {name}
            </h3>
            <span
              style={{
                display: "inline-block",
                marginTop: "4px",
                fontSize: "12px",
                fontWeight: 500,
                color: `hsl(${hue}, 55%, 40%)`,
                background: `hsl(${hue}, 55%, 95%)`,
                padding: "2px 10px",
                borderRadius: "20px",
              }}
            >
              {specialty}
            </span>
          </div>
        </div>

        {/* Bio */}
        {bio && (
          <p
            style={{
              fontSize: "14px",
              color: "#71717a",
              lineHeight: 1.5,
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {bio}
          </p>
        )}

        {/* Clinic info */}
        {clinicName && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              color: "#a1a1aa",
              marginTop: "auto",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{clinicName}</span>
            {clinicAddress && <span>· {clinicAddress}</span>}
          </div>
        )}

        {/* CTA */}
        <div
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#3b82f6",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            marginTop: "4px",
          }}
        >
          Book Appointment
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
