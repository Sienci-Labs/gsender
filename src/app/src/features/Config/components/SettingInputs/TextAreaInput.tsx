interface TextAreaInputProps {
    value: string;
    onChange: (value: string) => void;
    index: number;
    subIndex: number;
}

export function TextAreaInput({ value, onChange }: TextAreaInputProps) {
    return (
        <textarea
            rows={9}
            value={value}
            className="block font-mono rounded w-full px-0 text-xs text-gray-800 bg-white border border-gray-200 resize-none focus:outline-none"
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                onChange(e.target.value)
            }
        />
    );
}
