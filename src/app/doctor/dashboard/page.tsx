import { getDashboardStats, getPatients } from "../../actions";
import Dashboard from "@/components/Dashboard";

export default async function DoctorDashboardPage() {
    const [patientsResult, statsResult] = await Promise.all([
        getPatients(),
        getDashboardStats()
    ]);

    const initialPatients = patientsResult.success ? patientsResult.patients || [] : [];
    const stats = statsResult.success ? statsResult : {
        totalPatients: 0,
        sessionsToday: 0,
        pendingSuperbills: 0,
        upcomingAppointments: [],
        recentRiskAlerts: 0
    };

    return (
        <main className="min-h-screen bg-[#F7F5F0] flex flex-col">
            <Dashboard
                initialPatients={initialPatients}
                stats={{
                    totalPatients: stats.totalPatients,
                    sessionsToday: stats.sessionsToday,
                    pendingSuperbills: stats.pendingSuperbills,
                    upcomingAppointments: stats.upcomingAppointments,
                    recentRiskAlerts: stats.recentRiskAlerts
                }}
            />
        </main>
    );
}
