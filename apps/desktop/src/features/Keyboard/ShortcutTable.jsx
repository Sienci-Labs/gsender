import uniqueId from 'lodash/uniqueId';
import React, { useEffect, useState } from 'react';
import store from 'app/store';

function ShortcutTable({ forwardRef }) {
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
                                Action
                            </th>
                            <th className="bg-[#1f2937] font-extrabold text-white w-1/2 border border-solid">
                                Shortcut
                            </th>
                            <th className="bg-[#1f2937] font-extrabold text-white w-1/2 border border-solid">
                                Category
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {shortcuts.map((shortcut, i) => {
                            const { title, keys, category } = shortcut;
                            return keys ? (
                                <tr
                                    key={`${title}-${uniqueId()}`}
                                    className="border-b border-dotted border-[#BDB76B]"
                                >
                                    <td>{title || '-'}</td>
                                    <td>{keys || '-'}</td>
                                    <td>{category || '-'}</td>
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
