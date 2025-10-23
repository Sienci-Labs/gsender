import { useEffect, useState } from 'react';
import { Shield, ShieldOff } from 'lucide-react';
import controller from 'app/lib/controller.ts';

interface KeepoutToggleProps {
    initialFlags?: string[];
}

export function KeepoutToggle({ initialFlags = [] }: KeepoutToggleProps) {
    const [flags, setFlags] = useState<string[]>(initialFlags);
    const isEnabled = flags.includes('E');
    console.log(isEnabled);
    console.log(flags);

    useEffect(() => {
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

    if (!initialFlags) return <div></div>;

    return (
        <button
            onClick={handleToggle}
            className={`
        relative w-20 h-10 rounded-full
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
          w-8 h-8 bg-white rounded-full
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
