import { useTypedSelector } from 'app/hooks/useTypedSelector';
import type { RootState } from 'app/store/redux';
import { FileText, X } from 'lucide-react';
import type { CarveMode } from '../carveMode';

const CHIP =
    'absolute left-2.5 top-2.5 max-w-[calc(100%-20px)] flex items-center gap-1.5 px-2 py-1.5 rounded-md border border-outline-subtle bg-surface-sunken/[0.78] backdrop-blur-md';

export default function FileChip({
    mode,
    onLoad,
    onClose,
}: {
    mode: CarveMode;
    onLoad: () => void;
    onClose: () => void;
}) {
    const fileLoaded = useTypedSelector((s: RootState) => s.file.fileLoaded);
    const fileName = useTypedSelector((s: RootState) => s.file.name || '');

    if (mode === 'alarm' || mode === 'holdIdle') return null;

    if (!fileLoaded) {
        if (mode !== 'setup' && mode !== 'disconnected') return null;
        return (
            <button
                type="button"
                onClick={onLoad}
                className={`${CHIP} text-blue-400 active:brightness-125`}
            >
                <FileText className="w-[13px] h-[13px] shrink-0" aria-hidden />
                <span className="font-mono text-[10px] font-bold tracking-[0.04em] uppercase whitespace-nowrap">
                    Load file
                </span>
            </button>
        );
    }

    const canClose = mode === 'setup' || mode === 'disconnected';

    return (
        <div className={CHIP}>
            <span
                className="font-mono text-[10px] font-semibold text-content-secondary truncate max-w-[140px]"
                title={fileName}
            >
                {fileName}
            </span>
            {canClose && (
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close file"
                    className="flex shrink-0 text-content-muted active:text-content-primary"
                >
                    <X className="w-3 h-3" strokeWidth={2.25} />
                </button>
            )}
        </div>
    );
}
