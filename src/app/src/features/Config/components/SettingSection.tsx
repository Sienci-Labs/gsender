import {
    gSenderSetting,
    gSenderSubSection,
} from 'app/features/Config/assets/SettingsMenu.ts';
import { SettingRow } from 'app/features/Config/components/SettingRow.tsx';

interface SettingSectionProps {
    settings: gSenderSetting[];
    label?: string;
}
export function SettingSection({
    settings = [],
    label = null,
}: SettingSectionProps): JSX.Element {
    return (
        <div>
            {label && (
                <h2 className="text-blue-500 border-bottom border-blue-500">
                    {label}
                </h2>
            )}
            {settings.map((setting) => {
                return <SettingRow setting={setting} />;
            })}
        </div>
    );
}
