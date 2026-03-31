import PatientLayout from '@/components/patient/PatientLayout';

export default function PatientRootLayout({ children }: { children: React.ReactNode }) {
    return <PatientLayout>{children}</PatientLayout>;
}
