import { useSettings } from 'app/features/Config/utils/SettingsContext.tsx';
import Switch from 'app/components/Switch';

export function FilterDefaultToggle() {
    const { filterNonDefault, toggleFilterNonDefault } = useSettings();

    return (
        <div className="ml-8 flex flex-row gap-4 items-center max-xl:text-xs flex-grow">
            <p className="text-gray-500 max-xl:hidden">Show Modified</p>
            <p className="text-gray-500 hidden max-xl:block">Modified</p>
            <Switch
                onChange={toggleFilterNonDefault}
                checked={filterNonDefault}
            />
        </div>
    );
}
