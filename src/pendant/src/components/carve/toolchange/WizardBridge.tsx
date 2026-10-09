import { useWizardAPI } from 'app/features/Helper/context';
import reduxStore from 'app/store/redux';
import { enableWizard } from 'app/store/redux/slices/helper.slice.ts';
import pubsub from 'pubsub-js';
import { useEffect } from 'react';

/**
 * The wizard:load half of HelperWrapper, without its desktop Wizard modal or
 * HelperInfo popup; the carve screen renders the wizard inline instead.
 */
export default function WizardBridge(): null {
    const { load, updateSubstepOverlay } = useWizardAPI();

    useEffect(() => {
        const token = pubsub.subscribe('wizard:load', (_, payload) => {
            const { instructions, title, context, comment } = payload;
            load(instructions, title, { context, comment });
            updateSubstepOverlay(
                { activeStep: 0, activeSubstep: 0 },
                instructions.steps,
            );
            reduxStore.dispatch(enableWizard());
        });
        return () => {
            pubsub.unsubscribe(token);
        };
    }, []);

    return null;
}
