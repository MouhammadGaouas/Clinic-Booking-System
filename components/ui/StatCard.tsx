import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  color?: "blue" | "emerald" | "amber" | "red" | "violet";
}

const colorMap = {
  blue: {
    bg: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    iconBg: "rgba(255,255,255,0.2)",
    text: "#ffffff",
    sub: "rgba(255,255,255,0.8)",
  },
  emerald: {
    bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    iconBg: "rgba(255,255,255,0.2)",
    text: "#ffffff",
    sub: "rgba(255,255,255,0.8)",
  },
  amber: {
    bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    iconBg: "rgba(255,255,255,0.2)",
    text: "#ffffff",
    sub: "rgba(255,255,255,0.8)",
  },
  red: {
    bg: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    iconBg: "rgba(255,255,255,0.2)",
    text: "#ffffff",
    sub: "rgba(255,255,255,0.8)",
  },
  violet: {
    bg: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
    iconBg: "rgba(255,255,255,0.2)",
    text: "#ffffff",
    sub: "rgba(255,255,255,0.8)",
  },
};

export default function StatCard({ label, value, icon, trend, color = "blue" }: StatCardProps) {
  const c = colorMap[color];

  return (
    <div
      className="stat-card"
      style={{
        background: c.bg,
        borderRadius: "16px",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
        minHeight: "130px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        cursor: "default",
      }}
    >
      {/* Decorative circle */}
      <div
        style={{
          position: "absolute",
          top: "-20px",
          right: "-20px",
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "14px", fontWeight: 500, color: c.sub, letterSpacing: "0.02em" }}>
          {label}
        </span>
        {icon && (
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: c.iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "8px" }}>
        <span style={{ fontSize: "36px", fontWeight: 700, color: c.text, lineHeight: 1 }}>
          {value}
        </span>
        {trend && (
          <span style={{ fontSize: "13px", fontWeight: 500, color: c.sub }}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
