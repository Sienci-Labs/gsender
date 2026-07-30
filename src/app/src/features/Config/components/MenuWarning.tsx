import { TiWarning } from "react-icons/ti";

export function MenuWarning() {
    return (
        <div className="bg-yellow-100 border-t border-b border-yellow-500 text-yellow-700 px-4 py-3" role="alert">
            <p className="font-bold flex flex-row items-center gap-2 justify-center"><span><TiWarning /></span>Disconnected</p>
            <p className="text-sm text-center">Some settings may not appear unless connected to a machine.</p>
        </div>
    )
}
