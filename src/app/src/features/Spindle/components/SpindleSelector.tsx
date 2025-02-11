import Select from 'react-select';

type Spindle = {
    id: string;
    label: string;
    capabilities: string;
};

type FormattedSpindle = {
    label: string;
    value: string | number;
};

type Props = {
    spindles: Spindle[];
    onChange: (selectedOption: FormattedSpindle | null) => void;
    spindle: FormattedSpindle | null;
};

const formatSpindles = (spindles: Spindle[] = []): FormattedSpindle[] => {
    return spindles.map((spindle) => ({
        label: `${spindle.id}: ${spindle.label} (${spindle.capabilities})`,
        value: spindle.id,
    }));
};

const SpindleSelector = ({ spindles, onChange, spindle }: Props) => {
    const formattedSpindles = formatSpindles(spindles);
    return (
        <div className="flex gap-2 justify-center my-2 w-full items-center">
            <label className="font-semibold">Spindles</label>
            <Select<FormattedSpindle>
                options={formattedSpindles}
                placeholder="Default Spindle"
                value={spindle}
                onChange={onChange}
                className="w-full z-10"
                menuPlacement="top"
            />
        </div>
    );
};

export default SpindleSelector;
