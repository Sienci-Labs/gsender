import { useNavigate, useParams } from 'react-router';

import Page from 'app/components/Page';
import { Button } from 'app/components/Button';
import ProfileView from 'app/features/Gamepad/ProfileView';
import { useTypedSelector } from 'app/hooks/useTypedSelector';

type GamepadProfileParams = {
    gamepadProfileId: string;
};

function GamepadProfilePage() {
    const { gamepadProfileId } = useParams<GamepadProfileParams>();
    const navigate = useNavigate();
    const profile = useTypedSelector((state) =>
        state.gamepad.profiles.find((p) => p.id === gamepadProfileId),
    );

    if (!profile) {
        return (
            <Page title="Gamepad Profile Not Found" withGoBackButton>
                <div className="flex flex-col gap-4 items-center">
                    <div className="text-center mt-4">
                        The gamepad profile you are looking for does not exist.
                    </div>

                    <Button
                        onClick={() => navigate('/gamepad')}
                        variant="outline"
                        text="Back to Gamepad Profiles"
                    />
                </div>
            </Page>
        );
    }

    return (
        <Page title={profile.name} withGoBackButton>
            <ProfileView gamepadProfileId={gamepadProfileId} />
        </Page>
    );
}

export default GamepadProfilePage;
