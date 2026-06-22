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

import { useWizardAPI, useWizardContext } from "app/features/Helper/context";
import { Maximize2, Minus } from "lucide-react";
import React from "react";

const MinMaxButton = () => {
	const { minimized } = useWizardContext();
	const { toggleMinimized } = useWizardAPI();
	return (
		<button
			type="button"
			onClick={() => toggleMinimized(minimized)}
			aria-label={minimized ? "Restore wizard" : "Minimise wizard"}
			className="flex items-center justify-center w-7 h-7 rounded border border-gray-300 dark:border-[#3a3a48] bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors mr-1"
		>
			{minimized ? <Maximize2 size={12} /> : <Minus size={12} />}
		</button>
	);
};

export default MinMaxButton;
