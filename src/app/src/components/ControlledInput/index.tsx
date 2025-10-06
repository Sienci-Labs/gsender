import {
    ReactNode,
    ComponentProps,
    forwardRef,
    useEffect,
    useState,
} from 'react';
import { Input as ShadcnInput } from 'app/components/shadcn/Input';

type InputProps = ComponentProps<'input'> & {
    suffix?: ReactNode;
    label?: string | ReactNode;
    sizing?: 'xs' | 'sm' | 'md' | 'lg';
    wrapperClassName?: string;
    clearOnEnter?: boolean;
    immediateOnChange?: boolean; // New prop to enable immediate onChange calls
};

const ControlledInput = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            className,
            type,
            value,
            onChange,
            wrapperClassName,
            immediateOnChange = false,
            ...props
        },
        ref,
    ) => {
        const [originalValue, setOriginalValue] = useState(value);
        const [localValue, setLocalValue] = useState(value);

        useEffect(() => {
            setOriginalValue(value);
            setLocalValue(value);
        }, [value]);

        const saveChanges = (e: React.ChangeEvent<HTMLInputElement>) => {
            const current = e.target.value;
            if (localValue && localValue !== originalValue) {
                if (type === 'number') {
                    if (props.min !== null && current < props.min) {
                        e.target.value = String(props.min);
                        setLocalValue(props.min);
                    } else if (props.max !== null && current > props.max) {
                        e.target.value = String(props.max);
                        setLocalValue(props.max);
                    } else {
                        setLocalValue(current);
                    }
                } else {
                    setLocalValue(current);
                }
                modifiedOnChange(e);
            } else {
                setLocalValue(originalValue);
            }
        };

        const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            e.target.blur();
            saveChanges(e);
        };

        const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Escape') {
                setLocalValue(originalValue);
                saveChanges(
                    e as unknown as React.ChangeEvent<HTMLInputElement>,
                );
            } else if (e.key === 'Enter') {
                saveChanges(
                    e as unknown as React.ChangeEvent<HTMLInputElement>,
                );
            }
        };

        const modifiedOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setLocalValue(e.target.value);
            if (onChange) {
                onChange(e);
            }
        };

        const localChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setLocalValue(e.target.value);

            // If immediateOnChange is enabled, call onChange immediately
            if (immediateOnChange && onChange) {
                onChange(e);
            }
        };

        return (
            <ShadcnInput
                type={type}
                className={className}
                wrapperClassName={wrapperClassName}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                onChange={localChange}
                value={localValue}
                ref={ref}
                {...props}
            />
        );
    },
);

ControlledInput.displayName = 'ControlledInput';

export { ControlledInput };
