import { useState, ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileSidebar } from './MobileSidebar';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { useUserStore } from '@/stores/useUserStore';
import { useGamificationStore } from '@/stores/useGamificationStore';

interface PageLayoutProps {
    children: ReactNode;
    /* Optional: Override the main container classes */
    className?: string;
    /* Optional: Hide bottom nav on mobile if needed (e.g. detailed view) */
    showBottomNav?: boolean;
}

export function PageLayout({
    children,
    className = "",
    showBottomNav = true
}: PageLayoutProps) {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const { user } = useUserStore();
    const { xp, level, xpToNextLevel, currentStreak } = useGamificationStore();

    const userName = user?.name || "Usuário";

    return (
        <div className="h-screen bg-[#0f0f1a] text-white flex overflow-hidden">
            {/* DESKTOP SIDEBAR - Hidden on Mobile */}
            <div className="hidden lg:block w-72 flex-shrink-0 h-full">
                <Sidebar
                    userName={userName}
                    userLevel={level}
                    currentXP={xp}
                    xpToNextLevel={xpToNextLevel}
                    streak={currentStreak}
                />
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">

                {/* MOBILE HEADER - Hidden on Desktop */}
                <MobileHeader
                    userName={userName}
                    onMenuClick={() => setIsMobileSidebarOpen(true)}
                />

                {/* MOBILE SIDEBAR (Drawer) */}
                <MobileSidebar
                    isOpen={isMobileSidebarOpen}
                    onClose={() => setIsMobileSidebarOpen(false)}
                    userName={userName}
                    userLevel={level}
                    currentXP={xp}
                    xpToNextLevel={xpToNextLevel}
                    streak={currentStreak}
                />

                {/* SCROLLABLE CONTENT */}
                {/* pb-24 on mobile to account for BottomNav, p-0 on desktop (handled by children padding) */}
                <main className={`flex-1 overflow-y-auto w-full ${showBottomNav ? 'pb-24 lg:pb-0' : ''} ${className}`}>
                    {children}
                </main>

                {/* MOBILE BOTTOM NAV */}
                {showBottomNav && (
                    <div className="lg:hidden">
                        <MobileBottomNav />
                    </div>
                )}
            </div>
        </div>
    );
}
