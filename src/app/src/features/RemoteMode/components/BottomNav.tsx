import { Link } from '@tanstack/react-router';
import { IoSpeedometerOutline } from 'react-icons/io5';
import { FaTasks } from 'react-icons/fa';
import { RiToolsFill } from 'react-icons/ri';
import { RxDashboard } from 'react-icons/rx';
export function BottomNavLink({ label, icon, href }) {
    return (
        <Link
            href={href}
            className="inline-flex flex-col items-center justify-center border-gray-200 border-x hover:bg-gray-50 "
        >
            <span className="w-5 h-5 mb-2 text-gray-500  group-hover:text-blue-600 text-2xl">
                {icon}
            </span>
            <span className="text-sm text-gray-500  group-hover:text-blue-600">
                {label}
            </span>
        </Link>
    );
}

export function BottomNav() {
    return (
        <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-gray-100 border-t border-gray-200">
            <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
                <BottomNavLink
                    href="/remote/"
                    label="Control"
                    icon={<RxDashboard />}
                />
                <BottomNavLink
                    href="/remote/workflow"
                    label="Workflow"
                    icon={<IoSpeedometerOutline />}
                />
                <BottomNavLink
                    href="/remote/tools"
                    label="Tools"
                    icon={<RiToolsFill />}
                />
                <BottomNavLink
                    href="/remote/info"
                    label="Info"
                    icon={<FaTasks />}
                />
            </div>
        </div>
    );
}
