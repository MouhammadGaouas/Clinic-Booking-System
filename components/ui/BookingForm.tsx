"use client";

import { useState } from "react";

interface BookingFormProps {
  slotId: string;
  doctorId: string;
  slotTime: string;
  defaultName?: string;
  defaultEmail?: string;
  onSuccess?: () => void;
}

export default function BookingForm({
  slotId,
  doctorId,
  slotTime,
  defaultName = "",
  defaultEmail = "",
  onSuccess,
}: BookingFormProps) {
  const [patientName, setPatientName] = useState(defaultName);
  const [patientEmail, setPatientEmail] = useState(defaultEmail);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId, doctorId, patientName, patientEmail, reason }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Booking failed");
      }

      setSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div
        style={{
          padding: "32px",
          textAlign: "center",
          background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
          borderRadius: "16px",
          border: "1px solid #bbf7d0",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "#22c55e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#166534", margin: "0 0 8px" }}>
          Appointment Booked!
        </h3>
        <p style={{ fontSize: "14px", color: "#15803d", margin: 0 }}>
          Your appointment at <strong>{slotTime}</strong> has been submitted.
          You&apos;ll receive a confirmation email shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {error && (
        <div
          style={{
            padding: "12px 16px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "10px",
            color: "#dc2626",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="booking-name"
          style={{
            display: "block",
            fontSize: "14px",
            fontWeight: 600,
            color: "#3f3f46",
            marginBottom: "6px",
          }}
        >
          Full Name
        </label>
        <input
          id="booking-name"
          type="text"
          required
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
          placeholder="John Doe"
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1.5px solid #e4e4e7",
            fontSize: "15px",
            color: "#18181b",
            outline: "none",
            transition: "border-color 0.2s",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div>
        <label
          htmlFor="booking-email"
          style={{
            display: "block",
            fontSize: "14px",
            fontWeight: 600,
            color: "#3f3f46",
            marginBottom: "6px",
          }}
        >
          Email Address
        </label>
        <input
          id="booking-email"
          type="email"
          required
          value={patientEmail}
          onChange={(e) => setPatientEmail(e.target.value)}
          placeholder="john@example.com"
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1.5px solid #e4e4e7",
            fontSize: "15px",
            color: "#18181b",
            outline: "none",
            transition: "border-color 0.2s",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div>
        <label
          htmlFor="booking-reason"
          style={{
            display: "block",
            fontSize: "14px",
            fontWeight: 600,
            color: "#3f3f46",
            marginBottom: "6px",
          }}
        >
          Reason for Visit <span style={{ color: "#a1a1aa", fontWeight: 400 }}>(optional)</span>
        </label>
        <textarea
          id="booking-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Brief description of your symptoms or reason..."
          rows={3}
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1.5px solid #e4e4e7",
            fontSize: "15px",
            color: "#18181b",
            outline: "none",
            resize: "vertical",
            fontFamily: "inherit",
            transition: "border-color 0.2s",
            boxSizing: "border-box",
          }}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          padding: "12px 24px",
          borderRadius: "12px",
          border: "none",
          background: loading
            ? "#93c5fd"
            : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
          color: "#ffffff",
          fontSize: "15px",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
          boxShadow: loading ? "none" : "0 4px 14px rgba(37,99,235,0.3)",
          marginTop: "4px",
        }}
      >
        {loading ? "Booking..." : "Confirm Booking"}
      </button>
    </form>
  );
}
