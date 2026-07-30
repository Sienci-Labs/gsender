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

// http://stackoverflow.com/questions/1064089/inserting-a-text-where-cursor-is-using-javascript-jquery
const insertAtCaret = (
    textarea: HTMLTextAreaElement,
    text: string = '',
): void => {
    const scrollPos = textarea.scrollTop;
    const caretPos = textarea.selectionStart;
    const front = textarea.value.substring(0, caretPos);
    const back = textarea.value.substring(
        textarea.selectionEnd,
        textarea.value.length,
    );
    textarea.value = front + text + back;
    textarea.selectionStart = caretPos + text.length;
    textarea.selectionEnd = caretPos + text.length;
    textarea.focus();
    textarea.scrollTop = scrollPos;
};

export default insertAtCaret;
