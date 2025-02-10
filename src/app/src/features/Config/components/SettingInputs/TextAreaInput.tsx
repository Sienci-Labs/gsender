interface TextAreaInputProps {
    value: string;
    onChange: (e) => void;
    index: number;
    subIndex: number;
}

export function TextAreaInput({ value, onChange }) {
    return (
        <textarea
            cols={9}
            value={value}
            className="block w-full px-0 text-sm text-gray-800 bg-white border border-gray-200 resize-none focus:outline-none"
            onChange={(e) => onChange(e.target.value)}
        />
    );
}
