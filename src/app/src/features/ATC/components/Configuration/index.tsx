import { useState } from 'react';
import Button from 'app/components/Button';
import { Settings } from 'lucide-react';
import { ConfigModal } from 'app/features/ATC/components/Configuration/components/ConfigModal.tsx';

export function ATCIConfiguration() {
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-center">
                <Button
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-2 text-black text-4xl"
                    variant="ghost"
                    size="lg"
                >
                    <Settings className="h-4 w-4 text-4xl" />
                </Button>
            </div>

            <ConfigModal open={modalOpen} onOpenChange={setModalOpen} />
        </div>
    );
}
