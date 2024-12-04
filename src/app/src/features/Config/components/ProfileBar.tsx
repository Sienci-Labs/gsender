import { IconFunctionButton } from 'app/features/Config/components/IconFunctionButton.tsx';
import { GrRevert } from 'react-icons/gr';
import { PiLightning } from 'react-icons/pi';
import { CiImport } from 'react-icons/ci';
import { CiExport } from 'react-icons/ci';
import { MachineProfileSelector } from 'app/features/Config/components/MachineProfileSelector.tsx';

export function ProfileBar() {
    return (
        <div className="flex flex-row w-full p-4 min-h-1/5 justify-around items-center font-sans">
            <div className="border border-gray-200 flex flex-row items-center w-3/5 justify-between px-4 py-2">
                <div className="w-1/4">
                    <MachineProfileSelector />
                </div>

                <div className="flex flex-row gap-10">
                    <IconFunctionButton icon={<CiExport />} label="Export" />
                    <IconFunctionButton icon={<CiImport />} label="Import" />
                    <IconFunctionButton
                        icon={<GrRevert />}
                        label="Restore Defaults"
                    />
                    <IconFunctionButton icon={<PiLightning />} label="Flash" />
                </div>
            </div>
            <button className="bg-green-600 text-white p-3 text-lg rounded border-gray-500">
                Apply Settings
            </button>
        </div>
    );
}
