import cn from 'classnames';
import { RiSpeakLine } from 'react-icons/ri';
import {
    toggleWizardVisibility,
    toggleInfoHelperVisibility,
} from 'app/store/redux/slices/helper.slice';
import { RootState } from 'app/store/redux';
import { useSelector } from 'react-redux';
import reduxStore from 'app/store/redux';
import useShuttleEvents from 'app/hooks/useShuttleEvents';
import useKeybinding from 'app/lib/useKeybinding';
import { TOOLBAR_CATEGORY } from 'app/constants';

interface HelperToggleProps {
    minimized: boolean;
}

export function HelperToggle({ minimized }: HelperToggleProps) {
    const {
        wizardActive,
        infoHelperActive,
        title: helperTitle,
        wizardMinimized,
        infoHelperMinimized,
    } = useSelector((state: RootState) => state.helper);
    // const helperTitle = title;
    const helperEnabled = wizardActive || infoHelperActive;

    // const helperMinimized = wizardMinimized;

    // Direct user to ongoing action
    // const bringAttention = helperEnabled && helperMinimized;

    const handleToggle = () => {
        // this toggle will always minimize all if one is opened
        if (wizardMinimized || infoHelperMinimized) {
            if (wizardMinimized) {
                reduxStore.dispatch(toggleWizardVisibility());
            }
            if (infoHelperMinimized) {
                reduxStore.dispatch(toggleInfoHelperVisibility());
            }
        } else if (!wizardMinimized && !infoHelperMinimized) {
            // otherwise, if all are minimized, it opens all
            reduxStore.dispatch(toggleWizardVisibility());
            reduxStore.dispatch(toggleInfoHelperVisibility());
        }
    };

    const shuttleControlEvents = {
        TOGGLE_INFO_HELPER: {
            title: 'Toggle Helper Wizard',
            keys: '',
            cmd: 'TOGGLE_INFO_HELPER',
            preventDefault: false,
            isActive: true,
            category: TOOLBAR_CATEGORY,
            callback: () => {
                handleToggle();
            },
        },
    };

    useKeybinding(shuttleControlEvents);
    useShuttleEvents(shuttleControlEvents);

    return (
        <button
            type="button"
            disabled={!helperEnabled}
            onClick={handleToggle}
            className={cn(
                'flex w-full flex-col gap-0.5 content-center items-center text-sm text-gray-500 group rounded-xl transition-all duration-1000 opacity-100 border border-transparent dark:text-gray-400',
                {
                    'border bg-orange-200 bg-opacity-30 animate-bounce':
                        helperEnabled,
                    'border-transparent bg-transparent bg-opacity-100':
                        minimized,
                },
            )}
        >
            <RiSpeakLine
                className={`text-2xl ${helperEnabled ? 'text-orange-600' : 'text-gray-400'}`}
            />
            <span className={cn('text-xs', { 'opacity-0': minimized })}>
                {helperTitle}
            </span>
        </button>
    );
}
