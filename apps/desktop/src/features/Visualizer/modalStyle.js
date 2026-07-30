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

import { getThemeCssColor } from 'app/lib/getThemeCssColor';

// Called at render time (not module load) so the value reflects the theme
// active when the modal actually opens, not whatever was active at import.
export const getModalBackground = () =>
    getThemeCssColor('--surface-raised') || '#d1d5db';

export const getModalStyle = () => ({
    border: 'none',
    backgroundColor: getModalBackground(),
});

export const getModalHeaderStyle = () => ({
    backgroundColor: getModalBackground(),
    border: 'none',
});

export const modalTitleStyle = {
    color: '#dc2626',
    height: '22px',
};

export const modalBodyStyle = {
    fontSize: '1.25rem',
};

export const getModalFooterStyle = () => ({
    backgroundColor: getModalBackground(),
});
