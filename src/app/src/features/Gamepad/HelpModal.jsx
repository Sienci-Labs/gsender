import React, { useContext } from 'react';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from 'app/components/shadcn/Dialog';
import { GamepadContext } from './utils/context';
import { setCurrentModal } from './utils/actions';

const HelpModal = () => {
    const { dispatch } = useContext(GamepadContext);

    const closeModal = () => dispatch(setCurrentModal(null));

    return (
        <Dialog open={true} onOpenChange={() => closeModal()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Help with Gamepad</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 p-4 text-center">
                    <p>
                        Your gamepad setup needs to work correctly for shortcuts
                        to behave as expected. If you are experiencing issues,
                        use this online diagnostics tool to verify its
                        stability:
                    </p>
                    <a
                        href="https://hardwaretester.com/gamepad"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 underline"
                    >
                        Hardware Tester
                    </a>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default HelpModal;
