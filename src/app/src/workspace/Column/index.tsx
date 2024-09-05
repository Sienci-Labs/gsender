import { Widget } from "app/components/Widget";
import { Location } from "app/features/Location";

export const Column = () => {
    return (
        <div className="p-1 flex-1 box-border">
            <Widget>
                <Widget.Content
                    className=""
                    style={{ width: '100%' }}
                >
                    <Location />
                </Widget.Content>
            </Widget>
        </div>
    );
};
