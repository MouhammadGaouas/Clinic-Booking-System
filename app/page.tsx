"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";

function getDashboardPath(role: string) {
  switch (role) {
    case "DOCTOR": return "/dashboard";
    case "ADMIN": return "/admin/dashboard";
    default: return "/book";
  }
}

export default function Home() {
  const { data: session } = authClient.useSession();
  const role = session ? (session.user as any).role : null;

  return (
    <div style={{
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      background: "linear-gradient(180deg, #f8fafc 0%, #eff6ff 50%, #f8fafc 100%)",
    }}>
      <div style={{ maxWidth: "680px", width: "100%", textAlign: "center" }}>
        {session ? (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <h1 style={{ fontSize: "36px", fontWeight: 700, color: "#18181b", letterSpacing: "-0.02em", margin: "0 0 12px" }}>
              Welcome back, <span style={{ color: "#3b82f6" }}>{session.user.name}</span>!
            </h1>
            <p style={{ fontSize: "17px", color: "#71717a", margin: "0 0 32px", lineHeight: 1.6 }}>
              You are signed in as a <span style={{ fontWeight: 600, color: "#18181b" }}>{role?.toLowerCase()}</span>.
              {role === "PATIENT" && " Browse our doctors and book your next appointment."}
              {role === "DOCTOR" && " Manage your schedule and view upcoming appointments."}
              {role === "ADMIN" && " Monitor clinic performance and manage appointments."}
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
              <Link
                href={getDashboardPath(role)}
                style={{
                  padding: "13px 28px",
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "15px",
                  borderRadius: "12px",
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
                  transition: "all 0.2s ease",
                }}
              >
                {role === "PATIENT" ? "Book Appointment" : role === "DOCTOR" ? "Go to Dashboard" : "View Analytics"}
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <h1 style={{ fontSize: "48px", fontWeight: 800, color: "#18181b", letterSpacing: "-0.03em", margin: "0 0 16px", lineHeight: 1.1 }}>
              Your Health,{" "}
              <span style={{
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>Simplified</span>.
            </h1>
            <p style={{ fontSize: "18px", color: "#71717a", margin: "0 0 36px", lineHeight: 1.6 }}>
              MidCare helps you find doctors, book appointments, and manage your health records in one secure place.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
              <Link
                href="/sign-up"
                style={{
                  padding: "14px 32px",
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "16px",
                  borderRadius: "12px",
                  textDecoration: "none",
                  boxShadow: "0 4px 20px rgba(37,99,235,0.3)",
                  transition: "all 0.2s ease",
                }}
              >
                Get Started for Free
              </Link>
              <Link
                href="/sign-in"
                style={{
                  padding: "14px 32px",
                  background: "#fff",
                  color: "#18181b",
                  fontWeight: 700,
                  fontSize: "16px",
                  borderRadius: "12px",
                  textDecoration: "none",
                  border: "1.5px solid #e4e4e7",
                  transition: "all 0.2s ease",
                }}
              >
                Sign In
              </Link>
            </div>

            {/* Feature cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginTop: "56px" }}>
              {[
                { title: "Find Doctors", desc: "Browse specialists and book in seconds.", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
                { title: "Secure Records", desc: "Your data is encrypted and always private.", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
                { title: "Smart Scheduling", desc: "Get reminders and manage appointments.", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
              ].map((f) => (
                <div key={f.title} style={{ padding: "24px 20px", background: "#fff", borderRadius: "16px", border: "1px solid #f0f0f0", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={f.icon} />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#18181b", margin: "0 0 6px" }}>{f.title}</h3>
                  <p style={{ fontSize: "13px", color: "#a1a1aa", margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
