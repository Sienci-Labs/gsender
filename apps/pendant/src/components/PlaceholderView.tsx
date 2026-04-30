interface PlaceholderViewProps {
    title: string;
}

export default function PlaceholderView({ title }: PlaceholderViewProps) {
    return (
        <div className="flex-1 flex items-center justify-center">
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-dark-lighter p-12 text-center">
                <p className="text-2xl font-semibold text-gray-400 dark:text-gray-600">{title}</p>
                <p className="text-sm text-gray-400 dark:text-gray-700 mt-2">Coming soon</p>
            </div>
        </div>
    );
}
