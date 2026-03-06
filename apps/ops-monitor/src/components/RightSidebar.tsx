import { useState } from 'react';
import type { FeedItemMC } from '../types';

interface RightSidebarProps {
    feedItems: FeedItemMC[];
}

export function RightSidebar({ feedItems }: RightSidebarProps) {
    const [activeTab, setActiveTab] = useState<'FEED' | 'WHALE TRACKER' | 'FLIGHTS'>('FEED');

    return (
        <div className="w-full h-full flex flex-col bg-[#0B0D13] text-white p-4">
            <h2 className="font-bold text-lg mb-4">Right Sidebar</h2>
            <div className="flex border-b border-gray-800 mb-4 pb-2">
                <button
                    onClick={() => setActiveTab('FEED')}
                    className={`flex-1 ${activeTab === 'FEED' ? 'text-blue-500' : 'text-gray-500'}`}
                >
                    Feed
                </button>
                <button
                    onClick={() => setActiveTab('WHALE TRACKER')}
                    className={`flex-1 ${activeTab === 'WHALE TRACKER' ? 'text-blue-500' : 'text-gray-500'}`}
                >
                    Whales
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                <p>Selected Tab: {activeTab}</p>
                <p>Feed Items: {feedItems?.length || 0}</p>
            </div>
        </div>
    );
}
