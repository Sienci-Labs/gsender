interface StatCardProps {
    children?: React.ReactNode;
    externalLink?: string;
    externalLinkText?: string;
}

export function StatCard({ children }: StatCardProps) {
    return (
        <div className="bg-white border border-gray-300 rounded p-2 h-full">
            {children}
        </div>
    );
}
