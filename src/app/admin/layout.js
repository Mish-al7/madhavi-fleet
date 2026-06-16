'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Settings, LogOut, Truck, Users, CalendarCheck, Wallet, Cog, BarChart2, PieChart, Menu, X, ChevronDown, MapPin } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import NotificationBell from '@/components/ui/NotificationBell';

// Grouped navigation hierarchy
const SECTIONS = [
    {
        id: 'overview',
        title: 'Overview',
        items: [
            { href: '/admin/summary', icon: LayoutDashboard, label: 'Summary' },
            { href: '/admin/daily', icon: CalendarCheck, label: 'Daily Dashboard' }
        ]
    },
    {
        id: 'operations',
        title: 'Operations',
        items: [
            { href: '/admin/bookings', icon: CalendarCheck, label: 'Bookings' },
            { href: '/admin/trips', icon: Truck, label: 'Tour Trips' },
            { href: '/admin/trip-sheets', icon: FileText, label: 'Trip Sheets' },
            { href: '/admin/nightly-service', icon: FileText, label: 'Nightly Services' },
            { href: '/admin/invoices', icon: FileText, label: 'Invoices' }
        ]
    },
    {
        id: 'fleet',
        title: 'Fleet Management',
        items: [
            { href: '/admin/vehicles', icon: Truck, label: 'Vehicles' },
            { href: '/admin/drivers', icon: Users, label: 'Drivers' },
            { href: '/admin/routes', icon: MapPin, label: 'Routes' }
        ]
    },
    {
        id: 'financials',
        title: 'Financials',
        items: [
            { href: '/admin/ledger', icon: FileText, label: 'Ledgers' },
            { href: '/admin/expenses', icon: Wallet, label: 'Expenses' },
            { href: '/admin/opening-balances', icon: Settings, label: 'Opening Balances' },
            { href: '/admin/personal-ledger', icon: Wallet, label: 'Personal Ledger' }
        ]
    },
    {
        id: 'insights',
        title: 'Insights & Config',
        items: [
            { href: '/admin/reports', icon: BarChart2, label: 'Reports' },
            { href: '/admin/analytics', icon: PieChart, label: 'Analytics' },
            { href: '/admin/settings', icon: Cog, label: 'Company Settings' }
        ]
    }
];

export default function AdminLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, status } = useSession();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Accordion expand/collapse state
    const [openSections, setOpenSections] = useState(() => {
        const initial = {};
        SECTIONS.forEach(section => {
            const hasActiveChild = section.items.some(item => pathname === item.href || (item.href !== '/admin/summary' && pathname.startsWith(item.href)));
            initial[section.id] = hasActiveChild;
        });
        return initial;
    });

    // Auto-expand section if pathname changes (e.g. direct navigation)
    useEffect(() => {
        SECTIONS.forEach(section => {
            const hasActiveChild = section.items.some(item => pathname === item.href || (item.href !== '/admin/summary' && pathname.startsWith(item.href)));
            if (hasActiveChild) {
                setOpenSections(prev => ({
                    ...prev,
                    [section.id]: true
                }));
            }
        });
    }, [pathname]);

    // Redirect non-admin users
    useEffect(() => {
        if (status === 'loading') return;

        if (!session) {
            router.push('/auth/signin');
        } else if (session.user.role !== 'admin') {
            router.push('/trips/new');
        }
    }, [session, status, router]);

    // Show loading while checking auth
    if (status === 'loading' || !session || session.user.role !== 'admin') {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-slate-400">Loading...</div>
            </div>
        );
    }

    const toggleSection = (sectionId) => {
        setOpenSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const NavItem = ({ href, icon: Icon, label, pathname, isNested }) => {
        const currentPath = pathname || usePathname();
        const isActive = currentPath === href || (href !== '/admin/summary' && currentPath.startsWith(href));
        return (
            <Link
                href={href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 transition-all ${isNested
                        ? 'px-3.5 py-2 rounded-lg text-sm'
                        : 'px-4 py-3 rounded-xl text-sm'
                    } ${isActive
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                    }`}
            >
                <Icon size={isNested ? 18 : 20} />
                <span className="font-medium">{label}</span>
            </Link>
        );
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
            {/* Mobile Header */}
            <header className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 flex-shrink-0 z-20">
                <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        Admin Portal
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <NotificationBell />
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 -mr-2 text-slate-400 hover:text-white"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </header>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0 flex flex-col z-40 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="p-6 hidden md:block flex-shrink-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                                Admin Portal
                            </h1>
                            <p className="text-xs text-slate-500 mt-1">ActivFleet</p>
                        </div>
                        <NotificationBell align="left" />
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 md:hidden border-b border-slate-800 flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-white">Menu</h2>
                        <p className="text-xs text-slate-500">Fleet Ledger</p>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2 text-slate-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-3 flex flex-col gap-0 scrollbar-hide">
                    {SECTIONS.map((section) => {
                        const isOpen = !!openSections[section.id];
                        const hasActiveChild = section.items.some(item => pathname === item.href || (item.href !== '/admin/summary' && pathname.startsWith(item.href)));

                        return (
                            <div key={section.id} className="flex flex-col gap-1">
                                <button
                                    onClick={() => toggleSection(section.id)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all text-left ${hasActiveChild
                                            ? 'text-white font-medium bg-slate-800/30'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                                        }`}
                                >
                                    <span className="text-xs font-semibold tracking-wider uppercase">{section.title}</span>
                                    <ChevronDown
                                        size={16}
                                        className={`text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-400' : ''
                                            }`}
                                    />
                                </button>

                                <div
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0 pointer-events-none'
                                        }`}
                                >
                                    <div className="pl-3 border-l border-slate-800/60 ml-2.5 space-y-1.5 py-1">
                                        {section.items.map((item) => (
                                            <NavItem
                                                key={item.href}
                                                href={item.href}
                                                icon={item.icon}
                                                label={item.label}
                                                pathname={pathname}
                                                isNested={true}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    <div className="mt-auto pt-4 md:border-t border-slate-800 flex-shrink-0">
                        {session?.user && (
                            <div className="px-3 py-1.5 mb-2 flex items-center gap-2 bg-slate-800/20 rounded-lg border border-slate-800/40">
                                <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold flex-shrink-0">
                                    {(session.user.name || 'A')[0].toUpperCase()}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider leading-none">Admin</span>
                                    <span className="text-xs font-medium text-slate-300 truncate mt-0.5 leading-none">{session.user.name || 'Admin User'}</span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
                        >
                            <LogOut size={20} />
                            <span className="font-medium text-sm">Sign Out</span>
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-slate-950 p-4 md:p-6 w-full max-w-full">
                {children}
            </main>
        </div>
    );
}
