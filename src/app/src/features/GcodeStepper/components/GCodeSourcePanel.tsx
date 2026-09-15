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

import { useWorkspaceState } from "app/hooks/useWorkspaceState";
import { cn } from "app/lib/utils";
import { ChevronRight, Search, X } from "lucide-react";
import React, {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import {
	a11yDark,
	a11yLight,
} from "react-syntax-highlighter/dist/esm/styles/hljs";

// Row height must stay in sync with the row's rendered height for the
// windowing maths to line up.
const LINE_HEIGHT = 28;
const OVERSCAN = 12;
// How long after the last scroll event the list is treated as settled and rows
// go back to being syntax-highlighted.
const SCROLL_IDLE_MS = 150;

// Strips the highlighter's own box styling so tokens sit flush in the row and
// the row's background (current line, search match) shows through behind them.
const SYNTAX_CUSTOM_STYLE = {
	background: "transparent",
	padding: 0,
	margin: 0,
	fontSize: "inherit",
	lineHeight: "inherit",
	// The hljs themes' base style is `display: block; overflow-x: auto`, which
	// gives every long line its own horizontal scrollbar. Going back to inline
	// lets the row's `truncate` clip it with an ellipsis instead.
	display: "inline",
	overflowX: "hidden",
} as const;

interface GCodeSourceLineProps {
	line: string;
	lineNumber: number;
	isCurrent: boolean;
	isMatch: boolean;
	/** Highlighting is skipped mid-scroll — see SCROLL_IDLE_MS. */
	isScrolling: boolean;
	/** Exact width of the line-number gutter, in `ch` of the row's mono font. */
	gutterWidth: string;
	enableDarkMode: boolean;
	onSelect: (line: number) => void;
}

/**
 * One source row. Memoised so a scrub only re-renders the two rows whose
 * current/match state actually changed, not the whole window.
 */
const GCodeSourceLine = React.memo(
	({
		line,
		lineNumber,
		isCurrent,
		isMatch,
		isScrolling,
		gutterWidth,
		enableDarkMode,
		onSelect,
	}: GCodeSourceLineProps) => (
		<button
			type="button"
			onClick={() => onSelect(lineNumber)}
			style={{ top: (lineNumber - 1) * LINE_HEIGHT, height: LINE_HEIGHT }}
			className={cn(
				"absolute left-0 flex w-full items-center gap-1 px-2 text-left font-mono text-xs",
				// Every row reserves the accent bar so nothing shifts horizontally
				// when the current line moves.
				"border-l-4 border-transparent",
				isCurrent
					? "border-blue-500 bg-blue-500/25"
					: isMatch
						? "bg-yellow-100 dark:bg-yellow-900/30"
						: "hover:bg-gray-100 dark:hover:bg-surface-hover",
			)}
		>
			<ChevronRight
				className={cn(
					"h-3 w-3 shrink-0 text-blue-600 dark:text-blue-300",
					isCurrent ? "" : "invisible",
				)}
			/>
			<span
				style={{ width: gutterWidth }}
				className={cn(
					"shrink-0 text-right tabular-nums",
					isCurrent
						? "font-bold text-blue-700 dark:text-blue-200"
						: "text-gray-400 dark:text-content-muted",
				)}
			>
				{lineNumber}
			</span>
			<span className="ml-2 truncate text-gray-700 dark:text-content-secondary">
				{isScrolling ? (
					line || " "
				) : (
					<SyntaxHighlighter
						language="gcode"
						style={enableDarkMode ? a11yDark : a11yLight}
						customStyle={SYNTAX_CUSTOM_STYLE}
						PreTag="span"
						CodeTag="span"
					>
						{line || " "}
					</SyntaxHighlighter>
				)}
			</span>
		</button>
	),
);
GCodeSourceLine.displayName = "GCodeSourceLine";

interface GCodeSourcePanelProps {
	lines: string[];
	currentLine: number;
	onSelectLine: (line: number) => void;
	/**
	 * Hold the list still while the scrubber is being dragged — re-centring on
	 * every pointermove blanks the window out faster than it can render.
	 */
	deferScroll?: boolean;
}

/**
 * The loaded file's source, windowed so only the visible rows exist in the DOM.
 *
 * Follows the same fixed-row-height approach as the visualizer's G-code editor
 * rather than pulling in a virtualization dependency, and reuses its
 * highlighter setup so both views colour G-code identically.
 */
export const GCodeSourcePanel: React.FC<GCodeSourcePanelProps> = ({
	lines,
	currentLine,
	onSelectLine,
	deferScroll = false,
}) => {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [scrollTop, setScrollTop] = useState(0);
	const [viewportHeight, setViewportHeight] = useState(0);
	const [query, setQuery] = useState("");
	const [searchOpen, setSearchOpen] = useState(false);
	const [isScrolling, setIsScrolling] = useState(false);
	const rafRef = useRef<number | null>(null);
	const scrollIdleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const { enableDarkMode } = useWorkspaceState();

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
			if (scrollIdleRef.current) {
				clearTimeout(scrollIdleRef.current);
			}
		},
		[],
	);

	// Keep the selected line on screen, centred where the file is long enough.
	// Skipped mid-drag; because deferScroll is a dependency, releasing the
	// scrubber runs this once with the final line.
	useEffect(() => {
		const el = scrollRef.current;
		if (!el || viewportHeight === 0 || deferScroll) {
			return;
		}
		const rowTop = (currentLine - 1) * LINE_HEIGHT;
		const visibleTop = el.scrollTop;
		const visibleBottom = visibleTop + viewportHeight;
		if (rowTop >= visibleTop && rowTop + LINE_HEIGHT <= visibleBottom) {
			return;
		}
		el.scrollTop = Math.max(0, rowTop - viewportHeight / 2 + LINE_HEIGHT / 2);
	}, [currentLine, viewportHeight, deferScroll]);

	const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
		const next = e.currentTarget.scrollTop;
		setIsScrolling(true);
		if (scrollIdleRef.current) {
			clearTimeout(scrollIdleRef.current);
		}
		scrollIdleRef.current = setTimeout(
			() => setIsScrolling(false),
			SCROLL_IDLE_MS,
		);
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

	// Exactly as wide as the largest line number — `ch` is one character under the
	// row's monospace font, so there is no dead space after the playhead.
	const gutterWidth = `${String(lines.length).length}ch`;

	const visible = [];
	for (let i = start; i < end; i++) {
		const lineNumber = i + 1;
		visible.push(
			<GCodeSourceLine
				key={lineNumber}
				line={lines[i]}
				lineNumber={lineNumber}
				isCurrent={lineNumber === currentLine}
				isMatch={matchSet.has(lineNumber)}
				isScrolling={isScrolling}
				gutterWidth={gutterWidth}
				enableDarkMode={enableDarkMode}
				onSelect={onSelectLine}
			/>,
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
