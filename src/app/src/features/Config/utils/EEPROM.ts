import get from 'lodash/get';

export function getFilteredEEPROMSettings(
    settings,
    eeprom,
    halDescriptions,
    halGroups,
) {
    return Object.keys(eeprom).map((setting, index) => {
        const properties = settings.find((obj) => obj.setting === setting);
        const eKey = setting.replace('$', '');
        const halData = get(halDescriptions, `${eKey}`, {
            group: -1,
            details: '',
        });
        const halGroup = get(halGroups, `${halData.group}.label`, '');

        return {
            ...(properties || {}),
            globalIndex: index,
            setting,
            value: eeprom[setting],
            ...halData,
            group: halGroup,
            groupID: halData.group,
        };
    });
}
