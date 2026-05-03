"use client";

import { useState } from "react";
import { format } from "date-fns";

interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

interface SlotPickerProps {
  doctorId: string;
  onSlotSelect: (slot: Slot) => void;
  selectedSlotId?: string;
}

export default function SlotPicker({ doctorId, onSlotSelect, selectedSlotId }: SlotPickerProps) {
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchSlots = async (dateStr: string) => {
    setLoading(true);
    setFetched(false);
    try {
      const res = await fetch(`/api/slots?doctorId=${doctorId}&date=${dateStr}`);
      const data = await res.json();
      setSlots(Array.isArray(data) ? data : []);
    } catch {
      setSlots([]);
    }
    setLoading(false);
    setFetched(true);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDate(newDate);
    fetchSlots(newDate);
  };

  return (
    <div>
      {/* Date picker */}
      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            display: "block",
            fontSize: "14px",
            fontWeight: 600,
            color: "#3f3f46",
            marginBottom: "8px",
          }}
        >
          Select a date
        </label>
        <input
          type="date"
          value={date}
          onChange={handleDateChange}
          min={new Date().toISOString().split("T")[0]}
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1.5px solid #e4e4e7",
            fontSize: "15px",
            color: "#18181b",
            outline: "none",
            width: "100%",
            maxWidth: "280px",
            transition: "border-color 0.2s ease",
          }}
        />
      </div>

      {/* Slot grid */}
      {loading && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: "110px",
                height: "44px",
                borderRadius: "10px",
                background: "#f4f4f5",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          ))}
        </div>
      )}

      {!loading && fetched && slots.length === 0 && (
        <div
          style={{
            padding: "32px 20px",
            textAlign: "center",
            background: "#fafafa",
            borderRadius: "12px",
            border: "1px dashed #e4e4e7",
          }}
        >
          <p style={{ color: "#a1a1aa", fontSize: "14px", margin: 0 }}>
            No available slots for this date. Try another day.
          </p>
        </div>
      )}

      {!loading && slots.length > 0 && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {slots.map((slot) => {
            const isSelected = selectedSlotId === slot.id;
            return (
              <button
                key={slot.id}
                onClick={() => onSlotSelect(slot)}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: isSelected ? "2px solid #3b82f6" : "1.5px solid #e4e4e7",
                  background: isSelected
                    ? "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)"
                    : "#ffffff",
                  color: isSelected ? "#1d4ed8" : "#3f3f46",
                  fontWeight: isSelected ? 600 : 500,
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: isSelected ? "0 0 0 3px rgba(59,130,246,0.15)" : "none",
                }}
              >
                {format(new Date(slot.startTime), "HH:mm")}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
