import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import Select from 'react-select';

import Button from 'app/components/Button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from 'app/components/shadcn/Dialog';

import { MACRO_VARIABLES } from './constants';
import insertAtCaret from './insertAtCaret';
import { Input } from 'app/components/Input';

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
        return name.trim() !== '' && content.trim() !== '';
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
            <DialogContent className="bg-white w-1/2">
                <form
                    onSubmit={(event: FormEvent) => {
                        event.preventDefault();
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>
                            {id ? 'Edit Macro' : 'Add Macro'}
                        </DialogTitle>
                    </DialogHeader>
                    <DialogDescription className="mt-1 text-sm text-gray-500">
                        Macros are a way to store and reuse commands. They can
                        be used to speed up repetitive tasks and make your CNC
                        more efficient.
                    </DialogDescription>
                    <div className="flex flex-col gap-2 my-4">
                        <label>Macro Name</label>
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
                    <div className="flex flex-col gap-2 mb-4">
                        <div className="flex flex-row gap-2 items-center justify-between">
                            <label>Macro Commands</label>
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
                                placeholder="Macro Variables"
                                value={null}
                                styles={{
                                    option: (provided: any, state: any) => ({
                                        ...provided,
                                        fontSize: '0.875rem',
                                        whiteSpace: 'normal',
                                        wordWrap: 'break-word',
                                        backgroundColor: state.isFocused
                                            ? '#f0f0f0'
                                            : 'white',
                                        color: state.isFocused
                                            ? '#333'
                                            : '#666',
                                        padding: '10px',
                                        borderBottom: '1px solid #e0e0e0',
                                    }),
                                    menu: (provided: any) => ({
                                        ...provided,
                                        width: '100%',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                        marginTop: 0,
                                    }),
                                    group: (provided: any) => ({
                                        ...provided,
                                        padding: 0,
                                    }),
                                    control: (provided: any) => ({
                                        ...provided,
                                        minWidth: '150px',
                                        maxWidth: '100%',
                                        border: '1px solid #ccc',
                                        boxShadow: 'none',
                                    }),
                                    groupHeading: (provided: any) => ({
                                        ...provided,
                                        fontWeight: 'bold',
                                        color: '#333',
                                        backgroundColor: '#e0e0e0',
                                        margin: 0,
                                    }),
                                }}
                            />
                        </div>
                        <textarea
                            ref={contentRef}
                            rows={10}
                            className="border border-gray-300 rounded-md p-2 dark:text-white dark:bg-dark dark:border-gray-500"
                            name="content"
                            value={macroState.content}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-2 mb-4">
                        <label>Macro Description</label>
                        <textarea
                            ref={descriptionRef}
                            rows={4}
                            maxLength={MAX_CHARACTERS}
                            className="border border-gray-300 rounded-md p-2 dark:text-white dark:bg-dark dark:border-gray-500"
                            name="description"
                            value={macroState.description}
                            onChange={handleInputChange}
                        />
                    </div>
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
                        >
                            {id ? 'Update Macro' : 'Add New Macro'}
                        </Button>
                        <Button onClick={onCancel}>Cancel</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default MacroForm;
