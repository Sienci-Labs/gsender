import { useState } from 'react';
import { FaUserShield } from 'react-icons/fa';

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from 'app/components/shadcn/Sheet';
import Button from 'app/components/Button';
import { usePostHog } from '@posthog/react';

const DataCollection = () => {
    const posthog = usePostHog();
    const [open, setOpen] = useState(true);

    const handleAccept = async () => {
        posthog.opt_in_capturing();
        setOpen(false);
    };

    const handleDecline = async () => {
        posthog.opt_out_capturing();
        setOpen(false);
    };

    const consentStatus = posthog.get_explicit_consent_status();

    return (
        <Sheet open={open && consentStatus === 'pending'} onOpenChange={setOpen}>
            <SheetContent
                side="bottom"
                className="bg-white"
                transparent
                forceMount
            >
                <SheetHeader>
                    <SheetTitle>Anonymous Usage Information</SheetTitle>
                </SheetHeader>

                <div className="mt-4 flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <FaUserShield className="w-20 h-20" />

                        <div className="flex flex-col gap-4">
                            <p>
                                To continue making gSender better we&apos;re
                                trying to get a count on how many people use it,
                                what CNC they use it for, what computer they run
                                it on, and other app usage statistics.
                            </p>

                            <p>
                                This is completely optional and anonymous and
                                we&apos;ll only do it with your permission. You
                                can opt in or out at any time in the settings.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="alt" onClick={handleAccept}>
                            Accept
                        </Button>
                        <Button onClick={handleDecline}>Decline</Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default DataCollection;
