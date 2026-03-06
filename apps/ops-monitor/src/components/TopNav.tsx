import { Search, Settings, UserCircle, LayoutGrid } from 'lucide-react';

interface TopNavProps {
    isConnected: boolean;
    onConnectWallet: () => void;
}

export function TopNav({ isConnected, onConnectWallet }: TopNavProps) {
    return (
        <div className="w-full h-full flex items-center justify-between px-4">
            {/* Brand & Main Tabs */}
            <div className="flex items-center gap-8 h-full">
                {/* Logo/Brand Lockup */}
                <div className="flex items-center gap-2 text-white font-bold tracking-wide">
                    <div className="w-6 h-6 bg-blue-500 rounded relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-cyan-400"></div>
                    </div>
                    <span className="text-lg">MISSION CONTROL</span>
                </div>

                {/* Navigation Tabs */}
                <nav className="hidden md:flex h-full items-center gap-6 text-xs font-semibold tracking-widest text-gray-400 uppercase">
                    <button className="h-full border-b-2 border-transparent hover:text-white transition-colors">Terminal</button>
                    <button className="h-full border-b-2 border-transparent hover:text-white transition-colors">Markets</button>
                    <button className="h-full border-b-2 border-transparent hover:text-white transition-colors">Feed</button>
                    <button className="h-full border-b-2 border-transparent hover:text-white transition-colors">Movers</button>
                    <button className="h-full border-b-2 border-blue-500 text-white transition-colors">Monitor</button>
                </nav>
            </div>

            {/* Center Search */}
            <div className="flex-1 max-w-md hidden lg:flex items-center px-4">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search markets and events"
                        className="w-full bg-gray-900 border border-gray-800 rounded-md py-1.5 pl-9 pr-8 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600"
                    />
                    <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded text-[10px] font-mono border border-gray-700">F</kbd>
                </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3">
                {!isConnected ? (
                    <button
                        onClick={onConnectWallet}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-md text-xs font-medium transition-colors"
                    >
                        <UserCircle className="w-3.5 h-3.5" />
                        Setup Trading Wallet
                    </button>
                ) : (
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-md text-xs font-medium transition-colors">
                        <UserCircle className="w-3.5 h-3.5" />
                        Wallet Connected
                    </button>
                )}

                <div className="h-4 w-px bg-gray-800 mx-1"></div>

                <button className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-gray-800 transition-colors">
                    <LayoutGrid className="w-4 h-4" />
                </button>
                <button className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-gray-800 transition-colors">
                    <Settings className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
