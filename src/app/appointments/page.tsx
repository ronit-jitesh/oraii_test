import { getAppointments } from '@/app/actions';
import AppointmentsClient from '@/components/AppointmentsClient';

export default async function AppointmentsPage() {
    const result = await getAppointments();
    const appointments = result.success ? result.appointments || [] : [];

    return (
        <main style={{ minHeight: '100vh', background: '#F7F5F0' }}>
            <AppointmentsClient initialAppointments={appointments} />
        </main>
    );
}
