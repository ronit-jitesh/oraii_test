'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import {
    LayoutDashboard,
    History,
    LogOut,
    Calendar,
    DollarSign,
    Settings,
    ShieldCheck,
    ChevronDown,
} from 'lucide-react';
import { getPendingCount } from '@/app/actions';

const C = {
    bg: '#F7F5F0',
    card: '#FFFFFF',
    border: '#E2DDD5',
    borderSubtle: '#F0EDE6',
    primary: '#2D6A4F',
    primaryLight: '#D8EDDF',
    textPrimary: '#1A1A1A',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    danger: '#C0392B',
};

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUserEmail(user?.email || null);
        };
        getUser();
    }, [supabase.auth]);

    useEffect(() => {
        const fetchPending = async () => {
            const result = await getPendingCount();
            if (result.success) {
                setPendingCount(result.count || 0);
            }
        };
        fetchPending();
    }, [pathname]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    const navItems = [
        { href: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/appointments', label: 'Appointments', icon: Calendar, badge: pendingCount },
        { href: '/doctor/dashboard/billing', label: 'Billing', icon: DollarSign },
        { href: '/doctor/dashboard/validation', label: 'Validation', icon: ShieldCheck },
        { href: '/history', label: 'History', icon: History },
        { href: '/doctor/dashboard/settings', label: 'Settings', icon: Settings },
    ];

    const initials = userEmail ? userEmail.charAt(0).toUpperCase() : '?';

    return (
        <nav
            className="px-8 sticky top-0 z-50 transition-all duration-300 border-b"
            style={{
                height: 64,
                minHeight: 64,
                background: '#FFFFFF',
                borderColor: C.border,
                display: 'flex',
                alignItems: 'center'
            }}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
                {/* Logo */}
                <Link href="/doctor/dashboard" className="flex items-center gap-3 group">
                    <img
                        src="/logo.png"
                        alt="ORAII"
                        style={{ height: '52px', width: 'auto', objectFit: 'contain' }}
                    />
                </Link>

                {/* Nav Links */}
                <div className="flex items-center gap-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`relative flex items-center gap-2 px-3.5 py-2 transition-all duration-200`}
                                style={{
                                    color: isActive ? C.primary : '#1A1A1A',
                                    fontSize: '0.95rem',
                                    fontWeight: isActive ? 600 : 500,
                                    borderBottom: isActive ? `2px solid ${C.primary}` : '2px solid transparent',
                                    borderRadius: 0,
                                }}
                            >
                                <Icon
                                    size={18}
                                    strokeWidth={isActive ? 2 : 1.5}
                                    style={{ color: isActive ? C.primary : '#9CA3AF' }}
                                />
                                <span className="hidden xl:block">{item.label}</span>
                                {item.badge && item.badge > 0 && (
                                    <span className="absolute -top-1 right-1 min-w-[16px] h-[16px] flex items-center justify-center rounded-full text-[9px] font-bold text-white bg-red-500 leading-none px-1">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* User Menu */}
                <div className="flex items-center gap-4">
                    {userEmail && (
                        <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-lg border" style={{ background: C.bg, borderColor: C.borderSubtle }}>
                            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: C.primaryLight }}>
                                <span className="text-[10px] font-bold" style={{ color: C.primary }}>{initials}</span>
                            </div>
                            <span className="text-[0.875rem] font-medium max-w-[150px] truncate" style={{ color: '#6B7280' }}>{userEmail}</span>
                            <ChevronDown size={14} style={{ color: C.textMuted }} />
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-[13px] font-medium"
                        style={{ color: C.textMuted }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = C.danger; e.currentTarget.style.background = '#FFF5F5'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.background = 'transparent'; }}
                    >
                        <LogOut size={16} strokeWidth={1.5} />
                        <span className="hidden sm:block">Sign out</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}
