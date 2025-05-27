import { useState, useEffect } from 'react';
import { Switch } from 'app/components/shadcn/Switch';
import styles from './index.module.styl';

const BooleanInput = ({ info, setting, onChange, disabled, ...props }) => {
    let [bool, setBool] = useState(false);

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
        <div className={styles.row}>
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
