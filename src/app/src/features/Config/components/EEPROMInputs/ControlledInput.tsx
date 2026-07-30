import { useState, useRef, useEffect } from 'react';

import { Input } from 'app/components/shadcn/Input';

interface InputProps extends React.ComponentProps<'input'> {
    className: string;
    value: any;
    externalOnChange: (value: string) => void;
}

const ControlledInput = ({
    className,
    value,
    type = 'decimal',
    externalOnChange = null,
    ...rest
}: InputProps) => {
    const inputRef = useRef();
    const [originalValue, setOriginalValue] = useState(value);
    const [localValue, setLocalValue] = useState(value);

    /* If the value is changed up the tree, update both displayed and original value stored in component */
    useEffect(() => {
        setOriginalValue(value);
        setLocalValue(value);
    }, [value]);

    const onFocus = () => {
        //inputRef.current.select();
    };

    const onBlur = (e) => {
        if (localValue && localValue !== originalValue) {
            onChange(e);
        } else {
            setLocalValue(originalValue);
        }
    };

    const onKeyDown = (e) => {
        if (e.key === 'Escape') {
            setLocalValue(originalValue);
            inputRef.current.blur();
        } else if (e.key === 'Enter') {
            inputRef.current.blur();
        }
    };

    const onChange = (e) => {
        setLocalValue(inputRef.current.value);
        if (externalOnChange) {
            externalOnChange(inputRef.current.value);
        }
    };

    const localChange = (e) => {
        setLocalValue(inputRef.current.value);
    };

    return (
        <Input
            type={type}
            className={className}
            ref={inputRef}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            onChange={localChange}
            value={localValue}
            {...rest}
        />
    );
};

export default ControlledInput;
