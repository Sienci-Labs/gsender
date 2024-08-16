import { useState } from "react";
import { Widget } from "../../components/Widget";
import { Location } from "../../features/Location";

export const Column = () => {
    const [toggle, setToggle] = useState(false);
    return (
        <div className="border p-3 flex-1 box-border">
            <Widget>
                <Widget.Header>
                    <Widget.Title>
                        <span>Location</span>
                    </Widget.Title>
                    <Widget.Controls>
                        <Widget.Button
                            title={"Button"}
                            onClick={() => setToggle(!toggle)}
                        >
                            <span>click me!</span>
                        </Widget.Button>
                    </Widget.Controls>
                </Widget.Header>
                <Widget.Content
                    className=""
                    style={{ width: '100%' }}
                >
                    <Location />
                </Widget.Content>
                <Widget.Footer>
                    <span>{String(toggle)}</span>
                </Widget.Footer>
            </Widget>
        </div>
    );
};
