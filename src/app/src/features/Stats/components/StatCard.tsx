interface StatCardProps {
    children?: React.ReactNode;
    externalLink?: string;
    externalLinkText?: string;
}

export function StatCard({ children, label }: StatCardProps) {
    return (
        <div className="bg-white border border-gray-300 rounded p-2">
            {children}
        </div>
    );
}
