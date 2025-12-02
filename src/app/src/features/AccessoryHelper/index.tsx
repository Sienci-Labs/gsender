import { useParams } from 'react-router';
import { DirectoryListing } from 'app/features/AccessoryHelper/components/DirectoryListing.tsx';

export function AccessoryHelper() {
    const params = useParams();

    if (Object.keys(params).length === 0) {
        return <DirectoryListing />;
    }

    return (
        <div>
            <p>I am a page for {params.tool}</p>
        </div>
    );
}
