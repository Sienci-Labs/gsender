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
            min,
            max,
            ...props
        },
        ref,
    ) => {
        const [originalValue, setOriginalValue] = useState(value);
        const [localValue, setLocalValue] = useState(value);
        const [isFocused, setIsFocused] = useState(false);

        useEffect(() => {
            if (!isFocused) {
                setOriginalValue(value);
                setLocalValue(value);
            }
        }, [value, isFocused]);

        // Whether this input uses deferred numeric validation (allows ".", "" while typing)
        const isDeferredNumeric = type === 'number' && immediateOnChange;

        const saveChanges = (e: React.ChangeEvent<HTMLInputElement>) => {
            const current = e.target.value;

            if (isDeferredNumeric) {
                const parsed = parseFloat(current);
                if (current.trim() === '' || isNaN(parsed)) {
                    // Revert to original and notify parent so its state stays consistent
                    e.target.value = String(originalValue);
                    setLocalValue(originalValue);
                    if (onChange) onChange(e);
                    return;
                }
            }

            if (localValue && localValue !== originalValue) {
                if (type === 'number') {
                    if (min !== null && current < min) {
                        e.target.value = String(min);
                        setLocalValue(min);
                    } else if (max !== null && current > max) {
                        e.target.value = String(max);
                        setLocalValue(max);
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

        const onFocus = () => {
            setOriginalValue(localValue);
            setIsFocused(true);
        };

        const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(false);
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

            if (immediateOnChange && onChange) {
                if (isDeferredNumeric) {
                    // Only propagate valid numbers; allow intermediate states like "" or "." to display
                    const parsed = parseFloat(e.target.value);
                    if (!isNaN(parsed) && e.target.value.trim() !== '') {
                        onChange(e);
                    }
                } else {
                    onChange(e);
                }
            }
        };

        return (
            <ShadcnInput
                type={isDeferredNumeric ? 'text' : type}
                inputMode={isDeferredNumeric ? 'decimal' : undefined}
                className={className}
                wrapperClassName={wrapperClassName}
                onFocus={onFocus}
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
