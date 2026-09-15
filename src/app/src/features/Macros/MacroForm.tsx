import Button from 'app/components/Button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from 'app/components/shadcn/Dialog';
import { Input } from 'app/components/shadcn/Input';
import Tooltip from 'app/components/Tooltip';
import { getThemeCssColor } from 'app/lib/getThemeCssColor';
import { type ChangeEvent, type FormEvent, useRef, useState } from 'react';
import Select from 'react-select';
import { MACRO_VARIABLES } from './constants';
import insertAtCaret from './insertAtCaret';

const MAX_CHARACTERS = 128;

interface MacroFormProps {
    id?: string;
    macroName?: string;
    macroContent?: string;
    macroDescription?: string;
    onSubmit: (data: {
        id?: string;
        name: string;
        content: string;
        description: string;
    }) => void;
    onCancel: () => void;
    title: string;
    dialogDescription?: string;
    showNameField?: boolean;
    showDescriptionField?: boolean;
    submitLabel: string;
    allowEmptyContent?: boolean;
}

interface MacroState {
    name: string;
    content: string;
    description: string;
}

interface OptionType {
    value: string;
    label: string;
}

const MacroForm = ({
    id,
    macroName = '',
    macroContent = '',
    macroDescription = '',
    onSubmit,
    onCancel,
    title,
    dialogDescription,
    showNameField = true,
    showDescriptionField = true,
    submitLabel,
    allowEmptyContent = false,
}: MacroFormProps) => {
    const [macroState, setMacroState] = useState<MacroState>({
        name: macroName,
        content: macroContent,
        description: macroDescription,
    });

    const nameRef = useRef<HTMLInputElement>(null);
    const contentRef = useRef<HTMLTextAreaElement>(null);
    const descriptionRef = useRef<HTMLTextAreaElement>(null);

    const handleInputChange = (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = event.target;
        setMacroState((prevState) => ({ ...prevState, [name]: value }));
    };

    const validateForm = (): boolean => {
        const { name, content } = macroState;
        return (
            (showNameField ? name.trim() !== '' : true) &&
            (allowEmptyContent || content.trim() !== '')
        );
    };

    const options = MACRO_VARIABLES.reduce((acc: any[], v: any) => {
        if (typeof v === 'object') {
            const { group, text } = v;
            if (v.type === 'header') {
                acc.push({ label: text, options: [] });
            } else {
                const existingGroup = acc.find((item) => item.label === group);
                if (existingGroup) {
                    existingGroup.options.push({
                        value: text,
                        label: text,
                    });
                } else {
                    acc.push({
                        label: group,
                        options: [{ value: text, label: text }],
                    });
                }
            }
        } else {
            acc.push({ value: v, label: v });
        }
        return acc;
    }, []);

    return (
        <Dialog open onOpenChange={onCancel}>
            <DialogContent className="bg-white w-1/3 max-xl:w-[450px]">
                <form
                    onSubmit={(event: FormEvent) => {
                        event.preventDefault();
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                    </DialogHeader>
                    <DialogDescription className="mt-1 mb-4 text-sm text-gray-500">
                        {dialogDescription ??
                            'Macros are a way to store and reuse commands. They can be used to speed up repetitive tasks and make your CNC more efficient.'}
                    </DialogDescription>
                    {showNameField && (
                        <div className="flex flex-col gap-2 mb-4">
                            <label>Name</label>
                            <Input
                                ref={nameRef}
                                maxLength={MAX_CHARACTERS}
                                type="text"
                                name="name"
                                value={macroState.name}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                    )}
                    <div className="flex flex-col gap-2 mb-4">
                        <div className="flex flex-row gap-2 items-center justify-between">
                            <label>G-code</label>
                            <Select<OptionType>
                                options={options}
                                onChange={(selectedOption: OptionType) => {
                                    const textarea = contentRef.current;
                                    if (textarea && selectedOption) {
                                        insertAtCaret(
                                            textarea,
                                            selectedOption.value,
                                        );
                                        setMacroState((prevState) => ({
                                            ...prevState,
                                            content: textarea.value,
                                        }));
                                    }
                                }}
                                className="w-1/2"
                                placeholder="Variables"
                                value={null}
                                styles={{
                                    option: (
                                        provided: Record<string, unknown>,
                                        state: { isFocused: boolean },
                                    ) => ({
                                        ...provided,
                                        fontSize: '0.875rem',
                                        whiteSpace: 'normal',
                                        wordWrap: 'break-word',
                                        backgroundColor: state.isFocused
                                            ? getThemeCssColor(
                                                  '--surface-hover',
                                              ) || provided.backgroundColor
                                            : getThemeCssColor(
                                                  '--surface-elevated',
                                              ) || provided.backgroundColor,
                                        color:
                                            getThemeCssColor(
                                                '--content-secondary',
                                            ) || provided.color,
                                        padding: '10px',
                                        borderBottom: `1px solid ${getThemeCssColor('--outline-default') || 'transparent'}`,
                                    }),
                                    menu: (
                                        provided: Record<string, unknown>,
                                    ) => ({
                                        ...provided,
                                        width: '100%',
                                        backgroundColor:
                                            getThemeCssColor(
                                                '--surface-elevated',
                                            ) || provided.backgroundColor,
                                        border: `1px solid ${getThemeCssColor('--outline-default') || 'transparent'}`,
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                        marginTop: 0,
                                    }),
                                    menuList: (
                                        provided: Record<string, unknown>,
                                    ) => ({
                                        ...provided,
                                        scrollbarWidth: 'thin',
                                        scrollbarColor: `${getThemeCssColor('--outline-default') || '#59687B'} ${getThemeCssColor('--surface-sunken') || 'transparent'}`,
                                    }),
                                    group: (
                                        provided: Record<string, unknown>,
                                    ) => ({
                                        ...provided,
                                        padding: 0,
                                    }),
                                    control: (
                                        provided: Record<string, unknown>,
                                    ) => ({
                                        ...provided,
                                        minWidth: '150px',
                                        maxWidth: '100%',
                                        backgroundColor:
                                            getThemeCssColor(
                                                '--surface-raised',
                                            ) || provided.backgroundColor,
                                        border: `1px solid ${getThemeCssColor('--outline-default') || provided.borderColor}`,
                                        boxShadow: 'none',
                                    }),
                                    placeholder: (
                                        provided: Record<string, unknown>,
                                    ) => ({
                                        ...provided,
                                        color:
                                            getThemeCssColor(
                                                '--content-secondary',
                                            ) || provided.color,
                                    }),
                                    singleValue: (
                                        provided: Record<string, unknown>,
                                    ) => ({
                                        ...provided,
                                        color:
                                            getThemeCssColor(
                                                '--content-primary',
                                            ) || provided.color,
                                    }),
                                    input: (
                                        provided: Record<string, unknown>,
                                    ) => ({
                                        ...provided,
                                        color:
                                            getThemeCssColor(
                                                '--content-primary',
                                            ) || provided.color,
                                    }),
                                    dropdownIndicator: (
                                        provided: Record<string, unknown>,
                                    ) => ({
                                        ...provided,
                                        color:
                                            getThemeCssColor(
                                                '--content-secondary',
                                            ) || provided.color,
                                    }),
                                    indicatorSeparator: (
                                        provided: Record<string, unknown>,
                                    ) => ({
                                        ...provided,
                                        backgroundColor:
                                            getThemeCssColor(
                                                '--outline-default',
                                            ) || provided.backgroundColor,
                                    }),
                                    groupHeading: (
                                        provided: Record<string, unknown>,
                                    ) => ({
                                        ...provided,
                                        fontWeight: 'bold',
                                        color:
                                            getThemeCssColor(
                                                '--content-secondary',
                                            ) || provided.color,
                                        backgroundColor:
                                            getThemeCssColor(
                                                '--surface-sunken',
                                            ) || provided.backgroundColor,
                                        margin: 0,
                                    }),
                                }}
                            />
                        </div>

                        <Tooltip content="Add your g-code here. Use the variables or JavaScript logic to create more complex commands.">
                            <textarea
                                ref={contentRef}
                                rows={10}
                                className="border border-gray-300 rounded-md p-2 dark:text-content-primary dark:bg-surface-raised dark:border-outline"
                                name="content"
                                value={macroState.content}
                                onChange={handleInputChange}
                                required
                                title=""
                            />
                        </Tooltip>
                    </div>
                    {showDescriptionField && (
                        <div className="flex flex-col gap-2 mb-4">
                            <label>Macro Description</label>
                            <textarea
                                ref={descriptionRef}
                                rows={4}
                                maxLength={MAX_CHARACTERS}
                                className="border border-gray-300 rounded-md p-2 dark:text-content-primary dark:bg-surface-raised dark:border-outline"
                                name="description"
                                value={macroState.description}
                                onChange={handleInputChange}
                                title=""
                            />
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            color="primary"
                            onClick={() => {
                                if (validateForm()) {
                                    const { name, content, description } =
                                        macroState;
                                    onSubmit({
                                        id,
                                        name,
                                        content,
                                        description,
                                    });
                                }
                            }}
                            data-testid="add-macro-button"
                        >
                            {submitLabel}
                        </Button>
                        <Button onClick={onCancel}>Cancel</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default MacroForm;
