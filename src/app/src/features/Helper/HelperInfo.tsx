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

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "app/components/shadcn/Popover";
import cx from "classnames";
import { type JSX, useEffect, useState } from "react";
import { FaInfoCircle, FaTimes } from "react-icons/fa";
import { MdOutlineQrCode2 } from "react-icons/md";
import QRCode from "react-qr-code";
import { CSSTransition } from "react-transition-group";
import styles from "./index.module.styl";

interface Props {
	payload: {
		title: string;
		description: string;
		qrCode?: string;
		content: JSX.Element;
		resourceLink?: string;
	};
	infoVisible: boolean;
	onClose: () => void;
}

const HelperInfo = ({ payload, infoVisible, onClose }: Props) => {
	const { title, description, qrCode, resourceLink } = payload;
	const [visible, setVisible] = useState(infoVisible);

	useEffect(() => {
		setVisible(infoVisible);
	}, [infoVisible]);

	return (
		<div
			className={cx(
				"absolute bottom-2/3 xl:left-20 left-16 w-1/3 bg-white rounded flex flex-col content-end overflow-hidden z-50 border-2 border-orange-600",
				{
					hidden: !visible,
				},
			)}
		>
			<div className="border-b border-b-orange-600 p-2 flex flex-row justify-between items-center bg-amber-100/70">
				<h1 className="flex flex-row gap-2 items-center justify-center p-0 mr-4 text-orange-600 font-bold text-xl">
					<FaInfoCircle className="text-2xl" /> {title}
				</h1>
				<div className="flex cursor-pointer bg-amber-200/20 p-1 border-orange-500 border">
					<FaTimes onClick={() => onClose()} className="w-5 h-5" />
				</div>
			</div>
			<CSSTransition
				key="wizContent"
				timeout={350}
				classNames={{
					enterActive: styles.maximizeActive,
					enterDone: styles.maximizeDone,
					exitActive: styles.minimizeActive,
					exitDone: styles.minimizeDone,
				}}
			>
				<div
					id="wizContent"
					className="grid p-4 grid-cols-[80%,20%] divide-x gap-2 justify-center items-center"
				>
					<div className="flex flex-col">
						<span>{description}</span>
						{payload.content && (
							<div className="mt-2 p-2">{payload.content}</div>
						)}
					</div>
					{qrCode && (
						<div className="text-xs flex flex-col justify-center items-center text-center">
							<p>Need Help?</p>
							<p>Click Me!</p>
							<Popover>
								<PopoverTrigger className="w-20">
									<h1 className="flex flex-row gap-2 items-center justify-center p-0 text-blue-600 font-bold text-xl">
										<MdOutlineQrCode2 className="text-2xl" size={40} />
									</h1>
								</PopoverTrigger>
								<PopoverContent className="w-80 text-sm" side="right">
									<div className="flex flex-col items-center text-sm text-gray-600 gap-4 px-4 justify-center dark:text-white">
										<h1 className="text-blue-500 text-2xl">Scan QR Code</h1>
										<p>
											Scan with your phone camera to go to our resources page:
										</p>
										<div className="border-8 border-gray-900 dark:border-white rounded-md bg-white p-2">
											<QRCode value={qrCode} />
										</div>
									</div>
								</PopoverContent>
							</Popover>
						</div>
					)}
					{resourceLink && (
						<div className="text-xs flex flex-col justify-center items-center text-center">
							<p>Need Help?</p>
							<p>Follow along in our</p>
							<a
								href={resourceLink}
								target="_blank"
								rel="noopener noreferrer"
								className="text-blue-600 hover:text-blue-700 hover:underline"
							>
								online resources
							</a>
						</div>
					)}
				</div>
			</CSSTransition>
		</div>
	);
};

export default HelperInfo;
