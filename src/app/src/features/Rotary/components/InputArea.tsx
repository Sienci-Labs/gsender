import { Label } from 'app/components/shadcn/Label';

type InputAreaProps = {
    children: React.ReactNode;
    label: string;
};

const InputArea = ({ children, label }: InputAreaProps) => {
    return (
        <div className="grid grid-cols-5 items-center gap-4">
            <Label htmlFor={label} className="col-span-2">
                {label}
            </Label>
            {children}
        </div>
    );
};

export default InputArea;
