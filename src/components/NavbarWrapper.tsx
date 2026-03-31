'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function NavbarWrapper() {
    const pathname = usePathname();

    // Don't show navbar on auth/landing pages
    const hiddenPaths = ['/', '/login', '/signup', '/doctor/login', '/patient/login'];
    const isHidden = hiddenPaths.includes(pathname);

    if (isHidden) {
        return null;
    }

    return <Navbar />;
}
