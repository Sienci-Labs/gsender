import ConfirmationDialog from 'app/components/ConfirmationDialog/ConfirmationDialog';
import { Toaster } from 'app/components/shadcn/Sonner';
import { installPluginBridgeListener } from 'app/features/Plugins/utils/pluginBridge';
import { useDarkMode } from 'app/hooks/useDarkMode';
import { useEffect, useState } from 'react';
import BottomNav from './components/BottomNav';
import CarveView from './components/CarveView';
import InfoStrip from './components/InfoStrip';
import JobCompletionAlert from './components/JobCompletionAlert';
import PendantConfigView from './components/PendantConfigView';
import PendantToolsView from './components/PendantToolsView';
import PendantTopBar from './components/PendantTopBar';

type NavTab = 'carve' | 'tools' | 'config';

export default function PendantShell() {
    const [activeTab, setActiveTab] = useState<NavTab>('carve');
    useDarkMode(); // syncs workspace.enableDarkMode → <html class="dark">

    useEffect(() => {
        document.body.classList.add('pendant-mode');
        return () => {
            document.body.classList.remove('pendant-mode');
        };
    }, []);

    useEffect(() => {
        const removePluginBridge = installPluginBridgeListener();
        return () => removePluginBridge();
    }, []);

    return (
        <div className="h-screen w-screen flex flex-col bg-gray-100 dark:bg-surface-base overflow-hidden">
            <PendantTopBar />
            <InfoStrip />

            {/* Always mounted — keeps the SVG canvas alive across tab navigation */}
            <div
                className={
                    activeTab !== 'carve'
                        ? 'hidden'
                        : 'flex-1 flex flex-col min-h-0'
                }
            >
                <CarveView />
            </div>
            {activeTab === 'tools' && <PendantToolsView />}
            {activeTab === 'config' && <PendantConfigView />}

            <BottomNav active={activeTab} onChange={setActiveTab} />
            <JobCompletionAlert />
            <ConfirmationDialog />
            <Toaster closeButton visibleToasts={3} />
        </div>
    );
}
