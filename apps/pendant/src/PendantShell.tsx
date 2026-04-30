import { useState, useEffect } from 'react';
import { useDarkMode } from 'app/hooks/useDarkMode';
import PendantTopBar from './components/PendantTopBar';
import InfoStrip from './components/InfoStrip';
import CarveView from './components/CarveView';
import PlaceholderView from './components/PlaceholderView';
import PendantConfigView from './components/PendantConfigView';
import BottomNav from './components/BottomNav';

type NavTab = 'carve' | 'tools' | 'config';

export default function PendantShell() {
    const [activeTab, setActiveTab] = useState<NavTab>('carve');
    useDarkMode(); // syncs workspace.enableDarkMode → <html class="dark">

    useEffect(() => {
        document.body.classList.add('pendant-mode');
        return () => { document.body.classList.remove('pendant-mode'); };
    }, []);

    return (
        <div className="h-screen w-screen flex flex-col bg-white dark:bg-dark overflow-hidden">
            <PendantTopBar />
            <InfoStrip />

            {activeTab === 'carve' && <CarveView />}
            {activeTab === 'tools' && <PlaceholderView title="Tools" />}
            {activeTab === 'config' && <PendantConfigView />}

            <BottomNav active={activeTab} onChange={setActiveTab} />
        </div>
    );
}
