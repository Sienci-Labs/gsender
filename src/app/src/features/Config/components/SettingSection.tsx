import React, { JSX, useCallback } from 'react';
import { gSenderSetting } from 'app/features/Config/assets/SettingsMenu.ts';
import { SettingRow } from 'app/features/Config/components/SettingRow.tsx';
import { useSettings } from 'app/features/Config/utils/SettingsContext.tsx';
import cn from 'classnames';

interface SettingSectionProps {
    settings: gSenderSetting[];
    label?: string;
    connected?: boolean;
    wizard?: () => JSX.Element;
    showEEPROMOnly?: boolean;
}
export const SettingSection = React.memo(function SettingSection({
    settings = [],
    label = null,
    connected = false,
    wizard,
    showEEPROMOnly,
}: SettingSectionProps): JSX.Element {
    const { setSettingsValues, setSettingsAreDirty } = useSettings();

    const Wizard = wizard;

    const changeHandler = useCallback(
        (i: number) => (v: any) => {
            setSettingsAreDirty(true);

            setSettingsValues((prev) => {
                const updated = [...prev];
                updated[i].value = v;
                updated[i].dirty = true;

                const curSetting = updated[i];
                // For just switches for now - if onDisable and false, run onDisable
                if (
                    curSetting.type === 'boolean' &&
                    !v &&
                    'onDisable' in curSetting
                ) {
                    curSetting.onDisable();
                } else if (
                    curSetting.type === 'boolean' &&
                    v &&
                    'onEnable' in curSetting
                ) {
                    curSetting.onEnable();
                }

                return updated;
            });
        },
        [setSettingsAreDirty, setSettingsValues],
    );

    return (
        <fieldset
            className={cn(
                '[&:not(:first-child)]:border [&:not(:first-child)]:border-solid [&:not(:first-child)]:border-gray-300 rounded',
                {
                    'hidden text-gray-600': settings.length === 0,
                },
            )}
        >
            {label && !showEEPROMOnly && (
                <legend className="flex flex-row gap-8 mt-4 py-2 px-2 items-center">
                    <span className="text-blue-500  text-xl">{label}</span>
                    {connected && Wizard && <Wizard />}
                </legend>
            )}
            {settings.map((setting) => {
                return (
                    <SettingRow
                        setting={setting}
                        changeHandler={changeHandler}
                    />
                );
            })}
        </fieldset>
    );
});
