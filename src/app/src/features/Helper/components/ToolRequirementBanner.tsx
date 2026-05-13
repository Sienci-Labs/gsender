/*
 * Copyright (C) 2026 Sienci Labs Inc.
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

import React from 'react';

interface ToolRequirementBannerProps {
    toolLabel: string | null;
    comment?: string;
}

const ToolRequirementBanner = ({ toolLabel, comment }: ToolRequirementBannerProps) => {
    if (!toolLabel) {
        return null;
    }

    return (
        <div className="self-center w-full max-w-[320px] rounded-[8px] border border-emerald-300/80 bg-emerald-50 px-5 py-4 text-center shadow-sm dark:border-emerald-700/60 dark:bg-[#0d2518]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                Install New Tool
            </div>
            <div className="mt-2 text-5xl font-semibold leading-none text-emerald-700 dark:text-emerald-300">
                {toolLabel}
            </div>
            {comment ? (
                <div className="mt-4 rounded-[6px] border border-gray-200/90 bg-white/75 px-3 py-2 text-left font-mono text-xs leading-relaxed text-gray-500 whitespace-pre-wrap break-words dark:border-white/10 dark:bg-black/10 dark:text-gray-300">
                    {comment}
                </div>
            ) : null}
        </div>
    );
};

export default ToolRequirementBanner;
