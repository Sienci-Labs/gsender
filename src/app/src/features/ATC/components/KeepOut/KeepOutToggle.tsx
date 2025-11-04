import { useEffect, useState } from 'react';
import { Shield, ShieldOff } from 'lucide-react';
import controller from 'app/lib/controller.ts';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';

export function KeepoutToggle() {
    const [flags, setFlags] = useState<string[]>([]);
    const isEnabled = flags.includes('E');

    const initialFlags = useTypedSelector(
        (state: RootState) => state.controller.state.status?.keepout?.flags,
    );

    console.log('initialFlags', initialFlags);

    useEffect(() => {
        if (!initialFlags) {
            setFlags([]);
            return;
        }
        setFlags(initialFlags);
    }, [initialFlags]);

    const handleToggle = () => {
        const newEnabled = !isEnabled;

        if (newEnabled) {
            controller.command('gcode', ['M810 P1']);
        } else {
            controller.command('gcode', ['M810 P0']);
        }
    };

    if (!flags) return <div>OK</div>;

    return (
        <button
            onClick={handleToggle}
            className={`
        relative w-20 h-8 rounded-full
        transition-all duration-300 ease-in-out
        ${
            isEnabled
                ? 'bg-yellow-500 hover:bg-yellow-600 shadow-lg shadow-yellow-500/30'
                : 'bg-gray-300 hover:bg-gray-400 shadow-md'
        }
      `}
            aria-pressed={isEnabled}
        >
            <div
                className={`
          absolute top-1 flex items-center justify-center
          w-6 h-6 bg-white rounded-full
          transition-all duration-300 ease-in-out
          ${isEnabled ? 'left-11 text-yellow-600' : 'left-1 text-gray-600'}
        `}
            >
                {isEnabled ? (
                    <Shield className="w-5 h-5" />
                ) : (
                    <ShieldOff className="w-5 h-5" />
                )}
            </div>
        </button>
    );
}
