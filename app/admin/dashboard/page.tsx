import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { startOfMonth, endOfMonth } from "date-fns";
import StatCard from "@/components/ui/StatCard";

export const metadata = { title: "Admin Dashboard — MidCare" };

export default async function AdminDashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  if ((session.user as any).role !== "ADMIN") redirect("/");

  const now = new Date();
  const [total, confirmed, cancelled, completed] = await Promise.all([
    prisma.appointment.count(),
    prisma.appointment.count({ where: { status: "CONFIRMED" } }),
    prisma.appointment.count({ where: { status: "CANCELLED" } }),
    prisma.appointment.count({ where: { status: "COMPLETED" } }),
  ]);

  const thisMonth = await prisma.appointment.count({
    where: { slot: { startTime: { gte: startOfMonth(now), lte: endOfMonth(now) } } },
  });

  const noShowRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;

  const recentAppts = await prisma.appointment.findMany({
    take: 15, orderBy: { createdAt: "desc" },
    include: { slot: true, doctor: { select: { name: true } } },
  });

  const statusColors: Record<string, { bg: string; text: string }> = {
    PENDING: { bg: "#fef3c7", text: "#92400e" },
    CONFIRMED: { bg: "#dbeafe", text: "#1e40af" },
    COMPLETED: { bg: "#d1fae5", text: "#065f46" },
    CANCELLED: { bg: "#fee2e2", text: "#991b1b" },
  };

  return (
    <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#18181b", marginBottom: "8px" }}>Admin Dashboard</h1>
      <p style={{ fontSize: "15px", color: "#71717a", marginBottom: "36px" }}>Clinic-wide analytics and activity overview.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "36px" }}>
        <StatCard label="Total Appointments" value={total} color="blue" />
        <StatCard label="Confirmed" value={confirmed} color="emerald" />
        <StatCard label="Cancelled" value={cancelled} color="red" />
        <StatCard label="This Month" value={thisMonth} color="violet" trend={`${noShowRate}% no-show`} />
      </div>

      <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid #f0f0f0", overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f4f4f5" }}>
          <h2 style={{ fontSize: "17px", fontWeight: 600, color: "#18181b", margin: 0 }}>Recent Appointments</h2>
        </div>
        {recentAppts.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#a1a1aa" }}>No appointments yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "#fafafa" }}>
                  {["Patient", "Doctor", "Date", "Time", "Status"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#71717a", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentAppts.map(a => {
                  const sc = statusColors[a.status] || statusColors.PENDING;
                  return (
                    <tr key={a.id} style={{ borderTop: "1px solid #f4f4f5" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 500, color: "#18181b" }}>{a.patientName}</div>
                        <div style={{ fontSize: "12px", color: "#a1a1aa" }}>{a.patientEmail}</div>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#3f3f46" }}>{a.doctor.name}</td>
                      <td style={{ padding: "14px 16px", color: "#3f3f46" }}>{new Date(a.slot.startTime).toLocaleDateString()}</td>
                      <td style={{ padding: "14px 16px", color: "#3f3f46" }}>{new Date(a.slot.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 500, background: sc.bg, color: sc.text }}>{a.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
