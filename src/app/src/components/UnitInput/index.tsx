import { ControlledInput } from "app/components/ControlledInput";

import { Label } from "app/components/Label";
import cx from "classnames";

export interface UnitInputProps {
	units: string;
	label?: string;
	value: string | number;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	disabled?: boolean;
}

export function UnitInput({
	units,
	value,
	label,
	disabled,
	onChange,
}: UnitInputProps) {
	return (
		<div
			className={cx(
				"border border-gray-300 rounded flex flex-row items-center flex-1 justify-between pl-2 pr-2",
				{
					"opacity-50": disabled,
				},
			)}
		>
			{label && <Label className="flex items-center">{label}</Label>}
			<div className="flex flex-row items-center">
				<ControlledInput
					type="number"
					wrapperClassName="w-auto"
					className="w-[7ch] border-none margin-none p-0 focus:border-none focus:outline-none text-center"
					value={disabled ? "0" : value}
					onChange={onChange}
					disabled={disabled}
				/>
				<span className="shrink-0 pl-1 text-xs text-gray-500 dark:text-white">
					{units}
				</span>
			</div>
		</div>
	);
}

export default UnitInput;
