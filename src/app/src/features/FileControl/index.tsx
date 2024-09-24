import { Widget } from 'app/components/Widget';

import ButtonControlGroup from './ButtonControlGroup';
import FileInformation from './FileInformation';

export function FileControl() {
    return (
        <Widget>
            <Widget.Content>
                <div className="w-full flex flex-col gap-2">
                    <ButtonControlGroup />

                    <FileInformation />
                </div>
            </Widget.Content>
        </Widget>
    );
}
