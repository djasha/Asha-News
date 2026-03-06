import type { ReactNode } from 'react';

interface TerminalLayoutProps {
    topNav: ReactNode;
    tickerBar?: ReactNode;
    leftSidebar: ReactNode;
    rightSidebar: ReactNode;
    centerWorkspace: ReactNode;
}

export function TerminalLayout({
    topNav,
    tickerBar,
    leftSidebar,
    rightSidebar,
    centerWorkspace,
}: TerminalLayoutProps) {
    return (
        <div className="flex flex-col h-screen w-screen bg-[#07080a] text-gray-200 overflow-hidden font-sans">
            {/* Top Navigation Bar */}
            <header className="h-14 border-b border-gray-800/60 bg-[#0B0D13] flex-shrink-0 z-50 relative">
                {topNav}
            </header>

            {/* Ticker Bar (Optional) */}
            {tickerBar && (
                <div className="flex-shrink-0 z-40 relative">
                    {tickerBar}
                </div>
            )}

            {/* Main Workspace Area */}
            <div className="flex flex-row flex-1 overflow-hidden relative">

                {/* Left Sidebar (Crisis Analyst / Setup) */}
                <aside className="w-80 flex-shrink-0 border-r border-gray-800/60 bg-[#0B0D13]/95 hidden lg:flex flex-col z-40 relative">
                    {leftSidebar}
                </aside>

                {/* Center Main View (Map / Intel Cams) */}
                <main className="flex-1 relative bg-black/90 z-10 overflow-hidden">
                    {centerWorkspace}
                </main>

                {/* Right Sidebar (Feed / Intel) */}
                <aside className="w-[400px] flex-shrink-0 border-l border-gray-800/60 bg-[#0B0D13]/95 hidden xl:flex flex-col z-40 relative">
                    {rightSidebar}
                </aside>
            </div>

            {/* Optional: Mobile Bottom Navigation / Floating Controls could go here */}
        </div>
    );
}
