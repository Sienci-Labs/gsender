import React, { useEffect } from 'react';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { RootState } from 'app/store/redux';

export const AccessibilitySettingsHandler: React.FC = () => {
    const { focusRings } = useTypedSelector(
        (state: RootState) => state.preferences.accessibility,
    );

    useEffect(() => {
        if (focusRings) {
            document.body.classList.add('focus-rings-enabled');
        } else {
            document.body.classList.remove('focus-rings-enabled');
        }
    }, [focusRings]);

    return null;
};
