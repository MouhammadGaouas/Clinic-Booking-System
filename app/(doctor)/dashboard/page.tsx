import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DoctorDashboard() {
  const session = await auth.api.getSession({
      headers: await headers()
  });

  if (!session) redirect("/sign-in");

  const doctor = await prisma.doctor.findFirst({
    where: { user: { email: session.user?.email! } },
    include: {
      appointments: {
        include: { slot: true },
        orderBy: { slot: { startTime: "asc" } },
        take: 20,
      },
    },
  });

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-zinc-900">Welcome, {doctor?.name || session.user.name}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-white rounded-xl shadow-sm border border-zinc-100 flex flex-col items-center justify-center">
            <span className="text-sm font-medium text-zinc-500 mb-1">Today's Appointments</span>
            <span className="text-4xl font-bold text-blue-600">{doctor?.appointments.length ?? 0}</span>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-zinc-100 flex flex-col items-center justify-center">
            <span className="text-sm font-medium text-zinc-500 mb-1">Pending</span>
            <span className="text-4xl font-bold text-amber-500">
                {doctor?.appointments.filter(a => a.status === 'PENDING').length ?? 0}
            </span>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-zinc-100 flex flex-col items-center justify-center">
            <span className="text-sm font-medium text-zinc-500 mb-1">Completed</span>
            <span className="text-4xl font-bold text-emerald-500">
                {doctor?.appointments.filter(a => a.status === 'COMPLETED').length ?? 0}
            </span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
            <h2 className="text-lg font-semibold text-zinc-800">Recent Appointments</h2>
        </div>
        
        {doctor?.appointments.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
                No appointments found.
            </div>
        ) : (
            <div className="divide-y divide-zinc-100">
                {doctor?.appointments.map(appt => (
                    <div key={appt.id} className="p-6 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                        <div>
                            <p className="font-semibold text-zinc-900">{appt.patientName}</p>
                            <p className="text-sm text-zinc-500">{appt.patientEmail}</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="font-medium text-zinc-900">
                                    {new Date(appt.slot.startTime).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-zinc-500">
                                    {new Date(appt.slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                appt.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                                appt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                appt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                'bg-amber-100 text-amber-700'
                            }`}>
                                {appt.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </main>
  );
}
