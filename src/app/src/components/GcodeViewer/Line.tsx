interface LineProps {
    number: number;
    text: string;
}

const Line = ({ number, text }: LineProps) => {
    return (
        <div className="flex">
            <span className="w-12 text-right pr-2 text-gray-500">{number}</span>{' '}
            <span className="flex-1 font-mono">{text}</span>
        </div>
    );
};

export default Line;
