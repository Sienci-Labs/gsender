import React, { useEffect } from 'react';
import ReactHTMLTableToExcel from 'react-html-table-to-excel';
import store from '../../../store';
import styles from './shortcutTable.styl';


function ShortcutTable() {
    let shortcuts = '';

    useEffect(() => {
        shortcuts = store.get('commandKeys');
    }, [shortcuts]);

    return (
        <div className={styles.shortcutWrapper}>
            <div className={styles.pageTitle}>
                <h3>Print Preview</h3>
            </div>
            <div className={styles.table}>
                <ReactHTMLTableToExcel
                    id="test-table-xls-button"
                    className="download-table-xls-button"
                    table="table-to-xls"
                    filename="tablexls"
                    sheet="tablexls"
                    buttonText="Download as XLS"
                />
                <table id="table-to-xls">
                    <tr>
                        <th>Action</th>
                        <th>Shortcut</th>
                        <th>Category</th>
                        <th>Active Status</th>
                    </tr>
                    {shortcuts.map((shortcut) => {
                        const { title, keys, category, isActive } =
                                shortcut;
                        return (
                            <tr key={title}>
                                <td>{title}</td>
                                <td>{keys}</td>
                                <td>{category}</td>
                                <td>{isActive.toString()}</td>
                            </tr>
                        );
                    })}
                </table>
            </div>
            <div className={styles.buttons}>
                <div
                    onClick={() => window.print()}
                    aria-hidden="true"
                    className={styles.printButton}
                >
                    <i className="fa fa-print" aria-hidden="true" />
                </div>
                <div className={styles.closeButton}>
                    <i className="fa fa-window-close-o" aria-hidden="true" />
                </div>
            </div>
        </div>
    );
}

export default ShortcutTable;
