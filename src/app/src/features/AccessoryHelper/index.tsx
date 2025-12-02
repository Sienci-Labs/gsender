import { useParams } from 'react-router';
import { DirectoryListing } from 'app/features/AccessoryHelper/components/DirectoryListing.tsx';
import { MasterWizards } from 'app/features/AccessoryHelper/wizards';

export function AccessoryHelper() {
    const params = useParams();

    if (Object.keys(params).length === 0) {
        return (
            <DirectoryListing
                wizards={MasterWizards}
                onSelectWizard={() => {
                    console.log('selected wizard');
                }}
            />
        );
    }

    return (
        <div>
            <p>I am a page for {params.tool}</p>
        </div>
    );
}
