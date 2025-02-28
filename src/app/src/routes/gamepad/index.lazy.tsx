import { Link } from '@tanstack/react-router';
import { createLazyFileRoute } from '@tanstack/react-router';
import { Trash2 } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useState } from 'react';

import Button from 'app/components/Button';
import Page from 'app/components/Page';
import { Card } from 'app/components/shadcn/Card';
import { CardTitle } from 'app/components/shadcn/Card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from 'app/components/shadcn/AlertDialog';
import AddNewProfile from 'app/features/Gamepad/AddNewProfile';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { deleteProfile } from 'app/store/redux/slices/gamepadSlice';
import { toast } from 'app/lib/toaster';

export const Route = createLazyFileRoute('/gamepad/')({
    component: GamepadPage,
});

function GamepadPage() {
    const profiles = useTypedSelector((state) => state.gamepad.profiles);
    const dispatch = useDispatch();
    const [profileToDelete, setProfileToDelete] = useState<string | null>(null);

    const handleDeleteProfile = (profileId: string) => {
        dispatch(deleteProfile(profileId));
        setProfileToDelete(null);
        toast.info('Deleted gamepad profile');
    };

    return (
        <Page
            title="Gamepad Profiles"
            withGoBackButton
            description="Manage your gamepad profiles here"
        >
            <div className="flex flex-col gap-4">
                {profiles.length > 0 ? (
                    <>
                        <div>
                            <AddNewProfile />
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-2 gap-4">
                            {profiles.map((profile) => (
                                <Link to={`/gamepad/${profile.id}`}>
                                    <Card
                                        className="hover:bg-gray-300 bg-gray-100 cursor-pointer p-4 
                                flex flex-col items-center justify-center text-center gap-4 min-h-48 
                                transition-all duration-300 ease-in-out hover:scale-[1.02] h-full relative"
                                    >
                                        <CardTitle>{profile.name}</CardTitle>

                                        <Button
                                            variant="ghost"
                                            className="absolute top-2 right-2 py-2"
                                            onClick={(
                                                e: React.MouseEvent<HTMLButtonElement>,
                                            ) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setProfileToDelete(profile.id);
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="pt-4 text-center col-span-2 font-medium h-14 flex items-center justify-center flex-col gap-2">
                        No gamepad profiles found. Create one now.
                        <AddNewProfile />
                    </div>
                )}
            </div>

            <AlertDialog
                open={!!profileToDelete}
                onOpenChange={(open) => {
                    if (!open) setProfileToDelete(null);
                }}
            >
                <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Profile</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this gamepad
                            profile? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (profileToDelete) {
                                    handleDeleteProfile(profileToDelete);
                                }
                            }}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Page>
    );
}
