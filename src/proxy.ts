import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
    const response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    let user = null;
    try {
        const supabase = await createClient();
        const { data } = await supabase.auth.getUser();
        user = data?.user ?? null;
    } catch {
        user = null;
    }

    const pathname = request.nextUrl.pathname;

    // Protected route groups
    const doctorPaths = ['/doctor/dashboard', '/session', '/patients', '/appointments', '/history'];
    const patientPaths = [
        '/patient/dashboard',
        '/patient/chat',
        '/patient/games',
        '/patient/purpose',
        '/patient/screening',
        '/patient/notes',
        '/patient/book',
        '/patient/emergency',
        '/patient/journey',
        '/patient/mind-os',
    ];

    const isDoctorPath = doctorPaths.some(path =>
        pathname === path || pathname.startsWith(path + '/')
    );
    const isPatientPath = patientPaths.some(path =>
        pathname === path || pathname.startsWith(path + '/')
    );

    const isProtectedPath = isDoctorPath || isPatientPath;

    // Redirect unauthenticated users away from protected routes
    if (isProtectedPath && !user) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Role-Based Access Control
    if (user) {
        const role = user.user_metadata?.role;

        // Only redirect authenticated users away from the ROOT landing page to their dashboard
        const authPages = ['/', '/doctor/login', '/patient/login', '/login'];
        if (authPages.includes(pathname)) {
            if (role === 'doctor') return NextResponse.redirect(new URL('/doctor/dashboard', request.url));
            if (role === 'patient') return NextResponse.redirect(new URL('/patient/dashboard', request.url));
            return response;
        }

        // Enforce doctor-only access
        if (isDoctorPath && role && role !== 'doctor') {
            return NextResponse.redirect(new URL('/patient/dashboard', request.url));
        }

        // Enforce patient-only access
        if (isPatientPath && role && role !== 'patient') {
            return NextResponse.redirect(new URL('/doctor/dashboard', request.url));
        }
    }

    return response;
}

export const config = {
    matcher: [
        '/',
        '/doctor/:path*',
        '/patient/:path*',
        '/login',
        '/signup',
        '/session/:path*',
        '/patients/:path*',
        '/appointments',
        '/history/:path*',
    ],
};
