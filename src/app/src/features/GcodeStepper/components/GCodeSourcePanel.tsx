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

import { cn } from "app/lib/utils";
import { ChevronRight, Search, X } from "lucide-react";
import type React from "react";
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";

// Row height must stay in sync with the row's rendered height for the
// windowing maths to line up.
const LINE_HEIGHT = 28;
const OVERSCAN = 12;

interface GCodeSourcePanelProps {
	lines: string[];
	currentLine: number;
	onSelectLine: (line: number) => void;
}

/**
 * The loaded file's source, windowed so only the visible rows exist in the DOM.
 *
 * Follows the same fixed-row-height approach as the visualizer's G-code editor
 * rather than pulling in a virtualization dependency.
 */
export const GCodeSourcePanel: React.FC<GCodeSourcePanelProps> = ({
	lines,
	currentLine,
	onSelectLine,
}) => {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [scrollTop, setScrollTop] = useState(0);
	const [viewportHeight, setViewportHeight] = useState(0);
	const [query, setQuery] = useState("");
	const [searchOpen, setSearchOpen] = useState(false);
	const rafRef = useRef<number | null>(null);

	// Track the viewport so the window covers exactly what's on screen.
	useLayoutEffect(() => {
		const el = scrollRef.current;
		if (!el) {
			return;
		}
		const measure = () => setViewportHeight(el.clientHeight);
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	useEffect(
		() => () => {
			if (rafRef.current !== null) {
				cancelAnimationFrame(rafRef.current);
			}
		},
		[],
	);

	// Keep the selected line on screen, centred where the file is long enough.
	useEffect(() => {
		const el = scrollRef.current;
		if (!el || viewportHeight === 0) {
			return;
		}
		const rowTop = (currentLine - 1) * LINE_HEIGHT;
		const visibleTop = el.scrollTop;
		const visibleBottom = visibleTop + viewportHeight;
		if (rowTop >= visibleTop && rowTop + LINE_HEIGHT <= visibleBottom) {
			return;
		}
		el.scrollTop = Math.max(0, rowTop - viewportHeight / 2 + LINE_HEIGHT / 2);
	}, [currentLine, viewportHeight]);

	const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
		const next = e.currentTarget.scrollTop;
		if (rafRef.current !== null) {
			return;
		}
		rafRef.current = requestAnimationFrame(() => {
			rafRef.current = null;
			setScrollTop(next);
		});
	}, []);

	const matches = useMemo(() => {
		const trimmed = query.trim().toLowerCase();
		if (!trimmed) {
			return [];
		}
		const found: number[] = [];
		for (let i = 0; i < lines.length; i++) {
			if (lines[i].toLowerCase().includes(trimmed)) {
				found.push(i + 1);
				if (found.length >= 5000) {
					break;
				}
			}
		}
		return found;
	}, [query, lines]);

	const matchSet = useMemo(() => new Set(matches), [matches]);

	const goToNextMatch = () => {
		if (matches.length === 0) {
			return;
		}
		const next = matches.find((line) => line > currentLine) ?? matches[0];
		onSelectLine(next);
	};

	const { start, end } = useMemo(() => {
		const first = Math.max(0, Math.floor(scrollTop / LINE_HEIGHT) - OVERSCAN);
		const last = Math.min(
			lines.length,
			Math.ceil((scrollTop + viewportHeight) / LINE_HEIGHT) + OVERSCAN,
		);
		return { start: first, end: last };
	}, [scrollTop, viewportHeight, lines.length]);

	const visible = [];
	for (let i = start; i < end; i++) {
		const lineNumber = i + 1;
		const isCurrent = lineNumber === currentLine;
		visible.push(
			<button
				key={lineNumber}
				type="button"
				onClick={() => onSelectLine(lineNumber)}
				style={{ top: i * LINE_HEIGHT, height: LINE_HEIGHT }}
				className={cn(
					"absolute left-0 flex w-full items-center gap-2 px-2 text-left font-mono text-xs",
					isCurrent
						? "bg-blue-500 text-white"
						: matchSet.has(lineNumber)
							? "bg-yellow-100 text-gray-900 dark:bg-yellow-900/30 dark:text-content-primary"
							: "text-gray-700 hover:bg-gray-100 dark:text-content-secondary dark:hover:bg-surface-hover",
				)}
			>
				<ChevronRight
					className={cn("h-3 w-3 shrink-0", isCurrent ? "" : "invisible")}
				/>
				<span
					className={cn(
						"w-14 shrink-0 text-right tabular-nums",
						isCurrent ? "text-white" : "text-gray-400 dark:text-content-muted",
					)}
				>
					{lineNumber}
				</span>
				<span className="truncate">{lines[i]}</span>
			</button>,
		);
	}

	return (
		<div className="flex h-full min-h-0 flex-col gap-2">
			<div className="flex items-center justify-between gap-2">
				<span className="whitespace-nowrap text-xs uppercase tracking-wide text-gray-500 dark:text-content-muted">
					G-code ({lines.length.toLocaleString()} lines)
				</span>
				<button
					type="button"
					aria-label={searchOpen ? "Close search" : "Search G-code"}
					onClick={() => {
						setSearchOpen((prev) => !prev);
						setQuery("");
					}}
					className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-content-muted dark:hover:bg-surface-hover"
				>
					{searchOpen ? (
						<X className="h-4 w-4" />
					) : (
						<Search className="h-4 w-4" />
					)}
				</button>
			</div>

			{searchOpen && (
				<div className="flex items-center gap-2">
					<input
						// biome-ignore lint/a11y/noAutofocus: the field only mounts on an explicit search tap
						autoFocus
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								goToNextMatch();
							}
						}}
						placeholder="Search..."
						aria-label="Search G-code"
						className="h-10 w-full rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 dark:border-outline dark:bg-surface-sunken dark:text-content-primary"
					/>
					<span className="whitespace-nowrap text-xs text-gray-500 dark:text-content-muted">
						{query.trim() ? matches.length.toLocaleString() : "—"}
					</span>
				</div>
			)}

			<div
				ref={scrollRef}
				onScroll={handleScroll}
				className="relative min-h-0 flex-1 overflow-y-auto rounded-lg border border-gray-200 bg-white dark:border-outline dark:bg-surface-sunken"
			>
				<div
					style={{ height: lines.length * LINE_HEIGHT }}
					className="relative w-full"
				>
					{visible}
				</div>
			</div>

			<button
				type="button"
				onClick={() => onSelectLine(1)}
				className="min-h-[2.75rem] rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-100 dark:border-outline dark:bg-surface-elevated dark:text-content-primary dark:hover:bg-surface-hover"
			>
				Go to start
			</button>
		</div>
	);
};

export default GCodeSourcePanel;
