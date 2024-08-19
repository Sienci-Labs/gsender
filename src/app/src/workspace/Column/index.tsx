import { useState } from "react";
import { Widget } from "../../components/Widget";
import { Location } from "../../features/Location";

export const Column = () => {
    return (
        <div className="border p-1 flex-1 box-border">
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
