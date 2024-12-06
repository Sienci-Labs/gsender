import {
    gSenderSetting,
    gSenderSubSection,
} from 'app/features/Config/assets/SettingsMenu.ts';
import { SettingRow } from 'app/features/Config/components/SettingRow.tsx';
import { useSettings } from 'app/features/Config/utils/SettingsContext.tsx';
import { matchesSearchTerm } from 'app/features/Config/utils/Settings.ts';
import cn from 'classnames';

interface SettingSectionProps {
    settings: gSenderSetting[];
    label?: string;
}
export function SettingSection({
    settings = [],
    label = null,
}: SettingSectionProps): JSX.Element {
    const { setSettingsValues, setSettingsAreDirty, searchTerm } =
        useSettings();
    const changeHandler = (i) => (v) => {
        setSettingsAreDirty(true);

        setSettingsValues((prev) => {
            const updated = [...prev];
            updated[i].value = v;
            updated[i].dirty = true;
            return updated;
        });
    };

    const filteredSettings = settings.filter((o) =>
        matchesSearchTerm(o, searchTerm),
    );

    return (
        <div className={cn({ hidden: filteredSettings.length === 0 })}>
            {label && (
                <h2 className="text-blue-500 border-bottom border-blue-500">
                    {label}
                </h2>
            )}
            {filteredSettings.map((setting) => {
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
