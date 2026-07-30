import { cn } from "app/lib/utils";
import * as React from "react";

type InputProps = React.ComponentProps<"input"> & {
	suffix?: React.ReactNode;
	label?: string | React.ReactNode;
	sizing?: "xs" | "sm" | "md" | "lg";
	wrapperClassName?: string;
	// Marks the field as invalid so the bordered box (which owns the border when a
	// suffix is present) turns red. Text color can still be set via `className`.
	invalid?: boolean;
	type?: string;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	(
		{
			wrapperClassName,
			className,
			suffix,
			label,
			sizing = "md",
			invalid,
			type,
			...props
		},
		ref,
	) => {
		const inputSize = {
			xs: "h-6 text-sm px-2",
			sm: "h-8 text-sm px-2",
			md: "h-10 text-md px-3",
			lg: "h-12 text-lg px-4",
		}[sizing];

		// When a suffix is present, the bordered box becomes the flex container and
		// the suffix is laid out as a normal (non-overlapping) sibling of the input.
		// This reserves the suffix's own width in flow, so the value can never render
		// on top of the unit regardless of alignment, value length, or box width.
		const boxSize = {
			xs: "h-6 px-2",
			sm: "h-8 px-2",
			md: "h-10 px-3",
			lg: "h-12 px-4",
		}[sizing];
		const textSize = {
			xs: "text-sm",
			sm: "text-sm",
			md: "text-sm", // was a non-existent "text-md" (silent no-op)
			lg: "text-lg",
		}[sizing];

		return (
			<div className={cn("flex flex-col gap-2 w-full", wrapperClassName)}>
				{label && (
					<label
						className={cn(
							"text-sm font-medium text-gray-700 dark:text-white mb-2",
						)}
					>
						{label}
					</label>
				)}
				{suffix ? (
					<div
						className={cn(
							"flex items-center rounded-md border border-input bg-background ring-offset-background",
							"dark:bg-dark dark:border-gray-500",
							boxSize,
							invalid && "border-red-500 dark:border-red-500",
						)}
					>
						<input
							className={cn(
								"flex-1 min-w-0 h-full bg-transparent border-0 p-0",
								"text-robin-500 dark:text-white placeholder:text-muted-foreground",
								"focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
								textSize,
								className,
							)}
							ref={ref}
							title=""
							type={type}
							{...props}
						/>
						<div className="shrink-0 pl-2 text-xs flex items-center pointer-events-none text-gray-500 dark:text-white">
							{suffix}
						</div>
					</div>
				) : (
					<div className="relative flex items-center">
						<input
							className={cn(
								"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
								"text-robin-500 pr-10 dark:bg-dark dark:text-white dark:border-gray-500",
								inputSize,
								className,
							)}
							ref={ref}
							title=""
							type={type}
							{...props}
						/>
					</div>
				)}
			</div>
		);
	},
);

Input.displayName = "Input";

export { Input };
