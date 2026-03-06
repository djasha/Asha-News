import type { TickerItemMC } from '../types';

interface BreakingTickerProps {
    items: TickerItemMC[];
}

export function BreakingTicker({ items }: BreakingTickerProps) {
    type DisplayTickerItem = {
        id: string;
        title: string;
        timeAgo: string;
        severity: string;
    };

    // Mock data for initial styling if no items provided
    const displayItems: DisplayTickerItem[] = items.length > 0 ? items.map((item) => ({
        id: item.id,
        title: item.headline,
        timeAgo: item.updated_at,
        severity: item.severity,
    })) : [
        { id: '1', title: 'Sirens in Manama, Bahrain.', timeAgo: '5M', severity: 'HIGH' },
        { id: '2', title: 'US-Israeli airstrikes on Ilam, western Tehran.', timeAgo: '5M', severity: 'CRITICAL' },
        { id: '3', title: 'Repeated Israeli airstrikes on southern Lebanon.', timeAgo: '1M', severity: 'ELEVATED' },
    ];

    return (
        <div className="w-full bg-[#0B0D13] border-b border-gray-800/60 h-8 flex items-center px-4 overflow-hidden relative z-40 shrink-0">

            {/* Live Badge */}
            <div className="flex items-center gap-2 pr-4 border-r border-gray-800/80 mr-4 shrink-0">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] font-bold tracking-widest text-green-500">LIVE</span>
            </div>

            {/* Ticker Content */}
            <div className="flex-1 flex items-center gap-8 overflow-hidden whitespace-nowrap">
                <div className="animate-[ticker_60s_linear_infinite] inline-flex items-center gap-8 min-w-max">
                    {displayItems.map((item, idx) => (
                        <div key={`${item.id}-${idx}`} className="flex items-center gap-2 text-xs">
                            {item.severity === 'CRITICAL' && <span className="text-[9px] font-bold px-1.5 rounded bg-red-900/60 text-red-400 border border-red-800/50">CRITICAL</span>}
                            {item.severity === 'HIGH' && <span className="text-[9px] font-bold px-1.5 rounded bg-orange-900/40 text-orange-400 border border-orange-800/50">HIGH</span>}
                            {item.severity === 'ELEVATED' && <span className="text-[9px] font-bold px-1.5 rounded bg-yellow-900/30 text-yellow-500 border border-yellow-800/50">ELEVATED</span>}

                            <span className="text-gray-300 font-mono tracking-wide">{item.title}</span>
                            <span className="text-blue-500 font-mono text-[10px]">{item.timeAgo || 'NOW'}</span>
                        </div>
                    ))}
                    {/* Duplicate set for seamless looping */}
                    {displayItems.map((item, idx) => (
                        <div key={`dup-${item.id}-${idx}`} className="flex items-center gap-2 text-xs">
                            {item.severity === 'CRITICAL' && <span className="text-[9px] font-bold px-1.5 rounded bg-red-900/60 text-red-400 border border-red-800/50">CRITICAL</span>}
                            {item.severity === 'HIGH' && <span className="text-[9px] font-bold px-1.5 rounded bg-orange-900/40 text-orange-400 border border-orange-800/50">HIGH</span>}
                            {item.severity === 'ELEVATED' && <span className="text-[9px] font-bold px-1.5 rounded bg-yellow-900/30 text-yellow-500 border border-yellow-800/50">ELEVATED</span>}

                            <span className="text-gray-300 font-mono tracking-wide">{item.title}</span>
                            <span className="text-blue-500 font-mono text-[10px]">{item.timeAgo || 'NOW'}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Stats Counter */}
            <div className="flex items-center gap-4 pl-4 border-l border-gray-800/80 ml-auto shrink-0 bg-[#0B0D13]">
                <div className="flex flex-col items-end">
                    <span className="text-white font-mono text-sm leading-none">18</span>
                    <span className="text-[8px] text-gray-500 uppercase tracking-widest font-bold">Active Signals</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-white font-mono text-sm leading-none">5s ago</span>
                    <span className="text-[8px] text-gray-500 uppercase tracking-widest font-bold">Last Update</span>
                </div>
            </div>
        </div>
    );
}
