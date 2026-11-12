import { useAppTranslation } from 'app/i18n';
import store from 'app/store';
import uniqueId from 'lodash/uniqueId';
import React, { useEffect, useState } from 'react';
import { getCategoryLabel, getShortcutTitle } from './shortcutLabels';

function ShortcutTable({ forwardRef }) {
    const { t } = useAppTranslation();
    const [shortcuts, setShortcuts] = useState([{}]);

    useEffect(() => {
        setShortcuts(store.get('commandKeys'));
    }, []);

    return (
        <div
            className="z-[-1] absolute max-h-16 overflow-hidden"
            ref={forwardRef}
        >
            <div className="p-4">
                <table className="bg-[#FFFFE0] border border-solid text-black max-h-[21vh]">
                    <thead>
                        <tr>
                            <th className="bg-[#1f2937] font-extrabold text-white w-1/2 border border-solid">
                                {t('workspace:keyboard.table.action')}
                            </th>
                            <th className="bg-[#1f2937] font-extrabold text-white w-1/2 border border-solid">
                                {t('workspace:keyboard.table.shortcut')}
                            </th>
                            <th className="bg-[#1f2937] font-extrabold text-white w-1/2 border border-solid">
                                {t('workspace:keyboard.table.category')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {shortcuts.map((shortcut, i) => {
                            const { cmd, title, keys, category } = shortcut;
                            return keys ? (
                                <tr
                                    key={`${title}-${uniqueId()}`}
                                    className="border-b border-dotted border-[#BDB76B]"
                                >
                                    <td>
                                        {getShortcutTitle(cmd, title) || '-'}
                                    </td>
                                    <td>{keys || '-'}</td>
                                    <td>
                                        {category
                                            ? getCategoryLabel(category)
                                            : '-'}
                                    </td>
                                </tr>
                            ) : null;
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ShortcutTable;
