import { ChevronLeft } from 'lucide-react';

export function LeftSidebar() {
    return (
        <div className="w-full h-full flex flex-col bg-[#0B0D13]">
            {/* Header Tabs */}
            <div className="flex items-center border-b border-gray-800/60 shrink-0">
                <button className="flex-1 py-3 text-xs font-bold tracking-widest text-white border-b-2 border-blue-500 uppercase flex flex-col items-center">
                    Crisis Analyst <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1 rounded ml-1">AI</span>
                </button>
                <button className="flex-1 py-3 text-xs font-bold tracking-widest text-gray-500 border-b-2 border-transparent hover:text-gray-300 uppercase flex items-center justify-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Live Chat
                </button>
                <button className="w-10 flex items-center justify-center border-l border-gray-800/60 text-gray-400 hover:text-white h-full group">
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 custom-scrollbar">
                {/* Initial Synopsis */}
                <div className="flex flex-col gap-2">
                    <h3 className="text-xs font-bold tracking-widest text-[#4A8BFF] uppercase">Glint AI</h3>
                    <p className="text-sm text-gray-300 leading-relaxed font-mono">
                        The current situation involves escalating tensions between the US, Israel, and Iran, with the possibility of airstrikes, military operations, and potential declarations of war. President Trump has stated that there will be no deal with Iran except for unconditional surrender. The markets are heavily focused on the likelihood of a US-Iran ceasefire and US forces entering Iran. Recent events include US-Israeli airstrikes on western Tehran and ongoing discussions surrounding the conflict. Whale trades indicate significant bets being placed on the outcomes of these events. Overall, the prediction market is reflecting high uncertainty and volatility surrounding the situation in the Middle East.
                    </p>
                </div>

                {/* Suggestion Chips */}
                <div className="flex flex-col gap-2 mt-auto pb-2">
                    <button className="text-left px-4 py-3 text-sm text-gray-400 font-mono bg-[#0F131A] hover:bg-[#1A202C] hover:text-white rounded border border-gray-800 transition-colors">
                        What's the latest on Iran?
                    </button>
                    <button className="text-left px-4 py-3 text-sm text-gray-400 font-mono bg-[#0F131A] hover:bg-[#1A202C] hover:text-white rounded border border-gray-800 transition-colors">
                        Why are whales betting against this?
                    </button>
                    <button className="text-left px-4 py-3 text-sm text-gray-400 font-mono bg-[#0F131A] hover:bg-[#1A202C] hover:text-white rounded border border-gray-800 transition-colors">
                        Summarize Iran market sentiment
                    </button>
                </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-800/60 bg-[#0B0D13] shrink-0">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Ask about this crisis..."
                        className="w-full bg-[#1A202C]/50 border border-gray-800 rounded py-3 pl-4 pr-10 text-sm font-mono text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                    />
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-white transition-colors">
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 2L11 13" />
                            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
