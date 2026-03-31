'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    MessageCircle,
    Gamepad2,
    Compass,
    ClipboardCheck,
    FileText,
    Calendar,
    ShieldAlert,
    TrendingUp,
    LogOut,
    Activity,
    Menu,
    X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const NAV_ITEMS = [
    { href: '/patient/dashboard', label: 'Dashboard', icon: Home },
    { href: '/patient/chat', label: 'ORAII Chat', icon: MessageCircle },
    { href: '/patient/games', label: 'Get Distracted', icon: Gamepad2 },
    { href: '/patient/purpose', label: 'Finding Purpose', icon: Compass },
    { href: '/patient/screening', label: 'Screening', icon: ClipboardCheck },
    { href: '/patient/notes', label: 'Session Notes', icon: FileText },
    { href: '/patient/book', label: 'Book Session', icon: Calendar },
    { href: '/patient/emergency', label: 'Emergency', icon: ShieldAlert },
    { href: '/patient/journey', label: 'My Journey', icon: TrendingUp },
];

export default function PatientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);
    const [user, setUser] = React.useState<any>(null);

    const isLoginPage = pathname === '/patient/login';

    React.useEffect(() => {
        const checkUser = async () => {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);
            } catch {
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        checkUser();
    }, []);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/');
    };

    // If it's the login page, just render the children without the sidebar
    if (isLoginPage) {
        return <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>{children}</div>;
    }

    // While loading session, show a simple loader or nothing to avoid flicker
    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center font-bold" style={{ background: 'var(--color-bg)' }}>Loading ORAII...</div>;
    }

    return (
        <div className="min-h-screen flex" style={{ background: 'var(--color-bg)' }}>

            {/* Desktop Sidebar */}
            <aside
                className="hidden lg:flex flex-col w-64 border-r fixed h-full z-40"
                style={{
                    background: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                }}
            >
                {/* Logo */}
                <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="flex items-center gap-2.5">
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: 'var(--color-primary-light)' }}
                        >
                            <Activity size={20} style={{ color: 'var(--color-primary)' }} />
                        </div>
                        <div>
                            <span className="font-bold text-base" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>
                                ORAII
                            </span>
                            <span className="block text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'var(--color-text-muted)' }}>
                                Patient Portal
                            </span>
                        </div>
                    </div>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {NAV_ITEMS.map(item => {
                        const isActive = pathname === item.href || (item.href !== '/patient/dashboard' && pathname.startsWith(item.href));
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                                style={{
                                    background: isActive ? 'var(--color-primary-light)' : 'transparent',
                                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    fontWeight: isActive ? 600 : 500,
                                }}
                            >
                                <Icon size={18} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Sign Out */}
                <div className="px-3 py-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all hover:bg-red-50"
                        style={{ color: 'var(--color-text-muted)' }}
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div
                className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b"
                style={{
                    background: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                }}
            >
                <div className="flex items-center gap-2">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'var(--color-primary-light)' }}
                    >
                        <Activity size={16} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <span className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>ORAII</span>
                </div>
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="p-2 rounded-lg"
                    style={{ color: 'var(--color-text-muted)' }}
                >
                    {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Mobile Drawer */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-40">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
                    <div
                        className="absolute top-14 left-0 bottom-0 w-64 border-r overflow-y-auto"
                        style={{
                            background: 'var(--color-surface)',
                            borderColor: 'var(--color-border)',
                        }}
                    >
                        <nav className="px-3 py-4 space-y-1">
                            {NAV_ITEMS.map(item => {
                                const isActive = pathname === item.href || (item.href !== '/patient/dashboard' && pathname.startsWith(item.href));
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileOpen(false)}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                                        style={{
                                            background: isActive ? 'var(--color-primary-light)' : 'transparent',
                                            color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                        }}
                                    >
                                        <Icon size={18} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                        <div className="px-3 py-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full"
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                <LogOut size={18} />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 min-h-screen pt-14 lg:pt-0">
                {children}
            </main>
        </div>
    );
}
