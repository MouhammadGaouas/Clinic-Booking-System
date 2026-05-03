"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

interface SlotData {
  id: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1.5px solid #e4e4e7",
  fontSize: "14px",
  color: "#18181b",
  outline: "none",
  background: "#fff",
  boxSizing: "border-box",
};

export default function DoctorSchedulePage() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [slotDuration, setSlotDuration] = useState(30);
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(17);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<string | null>(null);
  const [genError, setGenError] = useState("");
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [doctorId, setDoctorId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/doctors").then(r => r.json()).then(docs => {
      if (docs.length > 0) setDoctorId(docs[0].id);
      setSlotsLoading(false);
    }).catch(() => setSlotsLoading(false));
  }, []);

  useEffect(() => { if (doctorId) fetchSlots(); }, [doctorId]);

  const fetchSlots = async () => {
    if (!doctorId) return;
    setSlotsLoading(true);
    const all: SlotData[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      try {
        const res = await fetch(`/api/slots?doctorId=${doctorId}&date=${d.toISOString().split("T")[0]}`);
        const data = await res.json();
        if (Array.isArray(data)) all.push(...data);
      } catch {}
    }
    setSlots(all);
    setSlotsLoading(false);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId) return;
    setGenerating(true); setGenResult(null); setGenError("");
    try {
      const res = await fetch("/api/slots/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId, startDate, endDate, slotDurationMinutes: slotDuration, startHour, endHour }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setGenResult(`Created ${data.count} slots!`);
      fetchSlots();
    } catch (err: any) { setGenError(err.message); }
    setGenerating(false);
  };

  return (
    <main style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#18181b", marginBottom: "8px" }}>Schedule Management</h1>
      <p style={{ fontSize: "15px", color: "#71717a", marginBottom: "36px" }}>Generate appointment slots and manage your availability.</p>

      <div style={{ background: "#fff", borderRadius: "20px", padding: "28px", border: "1px solid #f0f0f0", marginBottom: "32px", boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#18181b", margin: "0 0 20px" }}>Generate Time Slots</h2>
        <form onSubmit={handleGenerate}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#3f3f46", marginBottom: "6px" }}>Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#3f3f46", marginBottom: "6px" }}>End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#3f3f46", marginBottom: "6px" }}>Duration</label>
              <select value={slotDuration} onChange={e => setSlotDuration(Number(e.target.value))} style={inputStyle}>
                <option value={15}>15 min</option><option value={20}>20 min</option><option value={30}>30 min</option><option value={45}>45 min</option><option value={60}>60 min</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#3f3f46", marginBottom: "6px" }}>From</label>
              <select value={startHour} onChange={e => setStartHour(Number(e.target.value))} style={inputStyle}>
                {Array.from({ length: 14 }, (_, i) => i + 6).map(h => <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#3f3f46", marginBottom: "6px" }}>To</label>
              <select value={endHour} onChange={e => setEndHour(Number(e.target.value))} style={inputStyle}>
                {Array.from({ length: 14 }, (_, i) => i + 7).map(h => <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>)}
              </select>
            </div>
          </div>
          {genResult && <div style={{ padding: "12px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", color: "#166534", fontSize: "14px", marginBottom: "16px" }}>✓ {genResult}</div>}
          {genError && <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", color: "#dc2626", fontSize: "14px", marginBottom: "16px" }}>{genError}</div>}
          <button type="submit" disabled={generating || !doctorId} style={{ padding: "11px 28px", borderRadius: "12px", border: "none", background: generating ? "#93c5fd" : "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: generating ? "not-allowed" : "pointer", boxShadow: "0 4px 14px rgba(37,99,235,0.25)" }}>
            {generating ? "Generating..." : "Generate Slots"}
          </button>
        </form>
      </div>

      <div style={{ background: "#fff", borderRadius: "20px", padding: "28px", border: "1px solid #f0f0f0", boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#18181b", margin: "0 0 20px" }}>Upcoming Available Slots</h2>
        {slotsLoading ? (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ width: "130px", height: "52px", background: "#f4f4f5", borderRadius: "10px" }} />)}
          </div>
        ) : slots.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", background: "#fafafa", borderRadius: "12px", border: "1px dashed #e4e4e7" }}>
            <p style={{ color: "#a1a1aa", fontSize: "14px", margin: 0 }}>No upcoming slots. Generate your schedule above.</p>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {slots.map(s => (
              <div key={s.id} style={{ padding: "10px 16px", borderRadius: "10px", border: "1.5px solid #e4e4e7", background: "#fff", fontSize: "13px", color: "#3f3f46" }}>
                <div style={{ fontWeight: 600 }}>{format(new Date(s.startTime), "MMM d")}</div>
                <div style={{ color: "#71717a", fontSize: "12px" }}>{format(new Date(s.startTime), "HH:mm")} – {format(new Date(s.endTime), "HH:mm")}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
