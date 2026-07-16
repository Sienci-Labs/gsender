/*
 * Copyright (C) 2022 Sienci Labs Inc.
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

import { Zap, Clock } from 'lucide-react';

const ResumingJobNotice = () => {
    return (
        <div className="flex-1 flex items-center justify-center">
            <div className="max-w-sm w-full bg-white dark:bg-[#18181f] border border-gray-200 dark:border-[#2a2a35] rounded-xl p-8 text-center">
                <div className="relative w-[52px] h-[52px] mx-auto mb-4">
                    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                        <circle
                            cx="26"
                            cy="26"
                            r="23"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            className="text-gray-200 dark:text-[#2a2a35]"
                        />
                        <circle
                            cx="26"
                            cy="26"
                            r="23"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray="34 104"
                            fill="none"
                            className="text-blue-600 dark:text-blue-400"
                        >
                            <animateTransform
                                attributeName="transform"
                                type="rotate"
                                from="-90 26 26"
                                to="270 26 26"
                                dur="1.4s"
                                repeatCount="indefinite"
                            />
                        </circle>
                    </svg>
                    <Zap
                        size={18}
                        className="absolute inset-0 m-auto text-gray-400 dark:text-gray-500"
                    />
                </div>

                <div className="text-xs font-medium tracking-widest uppercase text-gray-400 dark:text-gray-500">
                    Resuming Job
                </div>
                <div className="text-lg font-medium mt-1 mb-3 text-gray-900 dark:text-[#e5e5ea]">
                    Job resuming
                </div>
                <div className="text-sm leading-relaxed mb-6 text-gray-600 dark:text-gray-400">
                    The machine needs to move back into position and may
                    need to spin the spindle back up to speed. The job will
                    continue automatically once this is complete.
                </div>

                <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800">
                    <Clock
                        size={16}
                        className="shrink-0 text-orange-500 dark:text-orange-400"
                    />
                    <span className="text-sm text-orange-800 dark:text-orange-300">
                        Do not interrupt the machine during this phase
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ResumingJobNotice;
