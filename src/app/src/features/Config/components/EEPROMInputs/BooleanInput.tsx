import { Switch } from "app/components/shadcn/Switch";
import { useEffect, useState } from "react";
import styles from "./index.module.styl";

const BooleanInput = ({ info, setting, onChange, disabled, ...props }) => {
	const [bool, setBool] = useState(false);

	useEffect(() => {
		let { value } = setting;
		value = Number(value) === 1;
		setBool(value);
	}, []);

	const booleanOnChange = (checked: boolean) => {
		const value = checked ? 1 : 0;
		setBool(checked);
		onChange(value);
	};

	return (
		<div className={styles.switchRow}>
			<Switch
				checked={bool}
				onChange={booleanOnChange}
				disabled={disabled}
				{...props}
			/>
		</div>
	);
};

export default BooleanInput;
