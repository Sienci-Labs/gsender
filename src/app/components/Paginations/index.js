/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

/*
 *     This file is part of gSender.
 *
 *     gSender is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     gSender is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 */

import React from 'react';
import * as Paginations from '@trendmicro/react-paginations';
import '@trendmicro/react-paginations/dist/react-paginations.css';
import i18n from 'app/lib/i18n';

export const TablePagination = (props) => {
    return (
        <Paginations.TablePagination
            {...props}
            pageRecordsRenderer={({ totalRecords, from, to }) => {
                if (totalRecords > 0) {
                    return i18n._('Records: {{from}} - {{to}} / {{total}}', {
                        from,
                        to,
                        total: totalRecords
                    });
                }

                return i18n._('Records: {{total}}', { total: totalRecords });
            }}
            pageLengthRenderer={({ pageLength }) => (
                <span>
                    {i18n._('{{pageLength}} per page', { pageLength })}
                    <i className="caret" />
                </span>
            )}
        />
    );
};
