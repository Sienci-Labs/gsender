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

import React from "react";
import cx from "classnames";

const Step = ({ step, index = 0, active }) => {
	return (
		<div
			className={cx(
				"px-3.5 py-2.5 border-l-2 cursor-default select-none",
				active
					? "border-l-blue-600 dark:border-l-blue-400 bg-blue-50 dark:bg-[#1a1f30]"
					: "border-l-transparent",
			)}
		>
			<div className="text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">
				Step {index + 1}
			</div>
			<div
				className={cx(
					"text-xs font-medium leading-snug",
					active
						? "text-blue-700 dark:text-blue-300"
						: "text-gray-500 dark:text-gray-500",
				)}
			>
				{step.title}
			</div>
			{step.firstRunOnly && (
				<span className="mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-[#2a1e00] text-amber-800 dark:text-amber-400">
					First run only
				</span>
			)}
		</div>
	);
};

export default Step;
