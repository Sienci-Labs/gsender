import { RootState } from 'app/store/redux';
import { useSelector } from 'react-redux';
import cx from 'classnames';
import { WizardProvider } from 'app/features/Helper/context';
import HelperWrapper from './HelperWrapper';

export function Helper() {
    const { wizardMinimized, infoHelperMinimized } = useSelector(
        (state: RootState) => state.helper,
    );
    const minimized = wizardMinimized && infoHelperMinimized;

    return (
        <div
            className={cx({
                hidden: minimized,
            })}
        >
            <WizardProvider>
                <HelperWrapper />
            </WizardProvider>
        </div>
    );
}
