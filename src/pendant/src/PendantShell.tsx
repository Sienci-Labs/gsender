import ConfirmationDialog from 'app/components/ConfirmationDialog/ConfirmationDialog';
import { Toaster } from 'app/components/shadcn/Sonner';
import { WizardProvider } from 'app/features/Helper/context';
import { installPluginBridgeListener } from 'app/features/Plugins/utils/pluginBridge';
import { useDarkMode } from 'app/hooks/useDarkMode';
import store from 'app/store';
import { useEffect, useState } from 'react';
import BottomNav from './components/BottomNav';
import CarveView from './components/CarveView';
import CarveScreen from './components/carve/CarveScreen';
import WizardBridge from './components/carve/toolchange/WizardBridge';
import CarveTopBar from './components/carve/topbar/CarveTopBar';
import { useCarveMode } from './components/carve/useCarveMode';
import InfoStrip from './components/InfoStrip';
import JobCompletionAlert from './components/JobCompletionAlert';
import PendantConfigView from './components/PendantConfigView';
import PendantToolsView from './components/PendantToolsView';
import PendantTopBar from './components/PendantTopBar';

type NavTab = 'carve' | 'tools' | 'config';

/** Old carve screen, kept reachable while parked features get tallied
 * (CARVE_REDESIGN_SPEC.md §0.4). */
const readLegacyCarve = () => Boolean(store.get('pendant.legacyCarve', false));

// The redesigned screens are Workshop-dark only. Scoping class="dark" +
// data-dark-theme here keeps them dark (tokens, CSS variables and shared
// components' dark: variants) whatever the workspace's dark-mode setting is.
function RedesignedCarve({ activeTab }: { activeTab: NavTab }) {
    const mode = useCarveMode();
    return (
        <>
            <div className="dark shrink-0" data-dark-theme="workshop">
                <CarveTopBar mode={mode} />
            </div>
            {/* Always mounted — keeps the GL canvas alive across tab navigation */}
            <div
                data-dark-theme="workshop"
                className={
                    activeTab !== 'carve'
                        ? 'dark hidden'
                        : 'dark flex-1 flex flex-col min-h-0'
                }
            >
                <CarveScreen mode={mode} />
            </div>
        </>
    );
}

export default function PendantShell() {
    const [activeTab, setActiveTab] = useState<NavTab>('carve');
    const [legacyCarve, setLegacyCarve] = useState(readLegacyCarve);
    useDarkMode(); // syncs workspace.enableDarkMode → <html class="dark">

    useEffect(() => {
        const onChange = () => setLegacyCarve(readLegacyCarve());
        store.on('change', onChange);
        return () => {
            store.removeListener('change', onChange);
        };
    }, []);

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
        <WizardProvider>
            <div className="h-screen w-screen flex flex-col bg-gray-100 dark:bg-surface-base overflow-hidden">
                {legacyCarve ? (
                    <>
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
                    </>
                ) : (
                    <>
                        <WizardBridge />
                        <RedesignedCarve activeTab={activeTab} />
                    </>
                )}
                {activeTab === 'tools' && <PendantToolsView />}
                {activeTab === 'config' && <PendantConfigView />}

                {legacyCarve ? (
                    <BottomNav active={activeTab} onChange={setActiveTab} />
                ) : (
                    // Part of the dark carve layout, like the top bar
                    <div className="dark shrink-0" data-dark-theme="workshop">
                        <BottomNav active={activeTab} onChange={setActiveTab} />
                    </div>
                )}
                <JobCompletionAlert />
                <ConfirmationDialog />
                <Toaster closeButton visibleToasts={3} />
            </div>
        </WizardProvider>
    );
}
