import { Widget } from 'app/components/Widget';
import { Location } from 'app/features/Location';

export const Column = () => {
    return (
        <div className="p-1 flex-1 box-border portrait:h-full">
            <Widget>
                <Widget.Content
                    className="justify-between"
                    style={{ width: '100%' }}
                >
                    <Location />
                </Widget.Content>
            </Widget>
        </div>
    );
};
