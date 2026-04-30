import { useState } from 'react';
import PendantTopBar from './components/PendantTopBar';
import InfoStrip from './components/InfoStrip';
import CarveView from './components/CarveView';
import PlaceholderView from './components/PlaceholderView';
import BottomNav from './components/BottomNav';

type NavTab = 'carve' | 'tools' | 'config';

export default function PendantShell() {
    const [activeTab, setActiveTab] = useState<NavTab>('carve');

    return (
        <div className="h-screen w-screen flex flex-col bg-dark overflow-hidden">
            <PendantTopBar />
            <InfoStrip />

            {/* Main content switches with bottom nav */}
            {activeTab === 'carve' && <CarveView />}
            {activeTab === 'tools' && <PlaceholderView title="Tools" />}
            {activeTab === 'config' && <PlaceholderView title="Config" />}

            <BottomNav active={activeTab} onChange={setActiveTab} />
        </div>
    );
}
