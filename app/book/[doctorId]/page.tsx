"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import SlotPicker from "@/components/ui/SlotPicker";
import BookingForm from "@/components/ui/BookingForm";
import { format } from "date-fns";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  bio?: string | null;
  clinic?: { name: string; address: string; phone: string };
}

interface SelectedSlot {
  id: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export default function BookDoctorPage() {
  const params = useParams();
  const doctorId = params.doctorId as string;
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);

  useEffect(() => {
    fetch(`/api/doctors/${doctorId}`)
      .then((r) => r.json())
      .then((data) => {
        setDoctor(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [doctorId]);

  if (loading) {
    return (
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ width: "200px", height: "28px", background: "#f4f4f5", borderRadius: "8px", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ width: "300px", height: "20px", background: "#f4f4f5", borderRadius: "8px", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ width: "100%", height: "200px", background: "#f4f4f5", borderRadius: "16px", animation: "pulse 1.5s ease-in-out infinite", marginTop: "16px" }} />
        </div>
      </main>
    );
  }

  if (!doctor) {
    return (
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 600, color: "#18181b" }}>Doctor not found</h2>
        <p style={{ color: "#71717a", marginTop: "8px" }}>This doctor profile doesn&apos;t exist or has been deactivated.</p>
        <a href="/book" style={{ color: "#3b82f6", fontWeight: 600, marginTop: "16px", display: "inline-block" }}>
          ← Back to doctors
        </a>
      </main>
    );
  }

  const hue = doctor.name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  return (
    <main style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 24px" }}>
      {/* Back link */}
      <a
        href="/book"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "14px",
          color: "#71717a",
          textDecoration: "none",
          marginBottom: "24px",
          fontWeight: 500,
          transition: "color 0.15s",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        All Doctors
      </a>

      {/* Doctor profile card */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          padding: "28px",
          border: "1px solid #f0f0f0",
          marginBottom: "32px",
          boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px", marginBottom: "16px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "18px",
              background: `linear-gradient(135deg, hsl(${hue}, 65%, 55%) 0%, hsl(${hue + 30}, 65%, 45%) 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "26px",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {doctor.name.split(" ").filter(w => w.length > 0).map(w => w[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#18181b", margin: "0 0 6px" }}>
              {doctor.name}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  color: `hsl(${hue}, 55%, 40%)`,
                  background: `hsl(${hue}, 55%, 95%)`,
                  padding: "3px 12px",
                  borderRadius: "20px",
                }}
              >
                {doctor.specialty}
              </span>
              {doctor.clinic && (
                <span style={{ fontSize: "13px", color: "#a1a1aa" }}>
                  {doctor.clinic.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {doctor.bio && (
          <p style={{ fontSize: "15px", color: "#52525b", lineHeight: 1.6, margin: 0 }}>
            {doctor.bio}
          </p>
        )}
      </div>

      {/* Step 1: Pick a slot */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          padding: "28px",
          border: "1px solid #f0f0f0",
          marginBottom: "24px",
          boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            1
          </div>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#18181b", margin: 0 }}>
            Pick a Time Slot
          </h2>
        </div>

        <SlotPicker
          doctorId={doctorId}
          onSlotSelect={(slot) => setSelectedSlot(slot)}
          selectedSlotId={selectedSlot?.id}
        />
      </div>

      {/* Step 2: Booking form (visible only after slot selection) */}
      {selectedSlot && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: "28px",
            border: "1px solid #f0f0f0",
            boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
            animation: "slideUp 0.3s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              2
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#18181b", margin: 0 }}>
              Confirm Your Details
            </h2>
          </div>

          <div
            style={{
              padding: "12px 16px",
              background: "#f0f9ff",
              borderRadius: "10px",
              border: "1px solid #bae6fd",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span style={{ fontSize: "14px", color: "#0369a1", fontWeight: 500 }}>
              Selected: {format(new Date(selectedSlot.startTime), "EEEE, MMMM d 'at' HH:mm")}
            </span>
          </div>

          <BookingForm
            slotId={selectedSlot.id}
            doctorId={doctorId}
            slotTime={format(new Date(selectedSlot.startTime), "EEEE, MMMM d 'at' HH:mm")}
          />
        </div>
      )}
    </main>
  );
}
