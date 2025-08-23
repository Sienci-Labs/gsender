interface StatCardProps {
    children?: React.ReactNode;
    externalLink?: string;
    externalLinkText?: string;
}

export function StatCard({ children }: StatCardProps) {
    return (
        <div className="border border-gray-300 rounded p-2 h-full dark:bg-dark dark:border-dark-lighter">
            {children}
        </div>
    );
}
