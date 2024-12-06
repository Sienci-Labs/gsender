import {
    gSenderSetting,
    gSenderSubSection,
} from 'app/features/Config/assets/SettingsMenu.ts';
import { SettingRow } from 'app/features/Config/components/SettingRow.tsx';
import { useSettings } from 'app/features/Config/utils/SettingsContext.tsx';

interface SettingSectionProps {
    settings: gSenderSetting[];
    label?: string;
}
export function SettingSection({
    settings = [],
    label = null,
}: SettingSectionProps): JSX.Element {
    const { setSettingsValues, setSettingsAreDirty } = useSettings();
    const changeHandler = (i) => (v) => {
        setSettingsAreDirty(true);
        console.log('this');
        console.log(v);
        setSettingsValues((prev) => {
            const updated = [...prev];
            updated[i].value = v;
            updated[i].dirty = true;
            console.log(updated[i]);
            return updated;
        });
    };

    return (
        <div>
            {label && (
                <h2 className="text-blue-500 border-bottom border-blue-500">
                    {label}
                </h2>
            )}
            {settings.map((setting) => {
                return (
                    <SettingRow
                        setting={setting}
                        changeHandler={changeHandler}
                    />
                );
            })}
        </div>
    );
}
