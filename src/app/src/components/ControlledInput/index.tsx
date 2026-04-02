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
            onFocus: externalOnFocus,
            onBlur: externalOnBlur,
            onKeyDown: externalOnKeyDown,
            wrapperClassName,
            immediateOnChange = false,
            min,
            max,
            step,
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
            const originalString = String(originalValue ?? '');
            const hasChanged = current !== originalString;
            const restoreOriginalValue = () => {
                e.target.value = originalString;
                setLocalValue(originalValue);
            };

            if (isDeferredNumeric) {
                const parsed = parseFloat(current);
                if (current.trim() === '' || isNaN(parsed)) {
                    // Revert to original and notify parent so its state stays consistent
                    restoreOriginalValue();
                    if (onChange) onChange(e);
                    return;
                }
            }

            if (hasChanged) {
                if (type === 'number') {
                    if (current.trim() === '') {
                        restoreOriginalValue();
                        return;
                    }

                    const numericCurrent = Number(current);
                    if (Number.isNaN(numericCurrent)) {
                        restoreOriginalValue();
                        return;
                    }

                    const numericMin =
                        min !== undefined && min !== null ? Number(min) : null;
                    const numericMax =
                        max !== undefined && max !== null ? Number(max) : null;

                    if (
                        numericMin !== null &&
                        !Number.isNaN(numericCurrent) &&
                        numericCurrent < numericMin
                    ) {
                        e.target.value = String(numericMin);
                        setLocalValue(numericMin);
                    } else if (
                        numericMax !== null &&
                        !Number.isNaN(numericCurrent) &&
                        numericCurrent > numericMax
                    ) {
                        e.target.value = String(numericMax);
                        setLocalValue(numericMax);
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

        const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
            setOriginalValue(localValue);
            setIsFocused(true);
            if (externalOnFocus) {
                externalOnFocus(e);
            }
        };

        const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            saveChanges(e);
            setIsFocused(false);
            if (externalOnBlur) {
                externalOnBlur(e);
            }
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
            if (externalOnKeyDown) {
                externalOnKeyDown(e);
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
                step={type === 'number' && step == null ? 'any' : step}
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
