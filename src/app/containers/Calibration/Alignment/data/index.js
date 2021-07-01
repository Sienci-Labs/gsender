/* eslint-disable react/prop-types */
import React, { useState } from 'react';

import store from 'app/store';
import controller from 'app/lib/controller';
import Button from 'app/components/FunctionButton/FunctionButton';

import Input from '../../Input';

import styles from '../index.styl';

const inputStyle = {
    width: '100px',
    textAlign: 'center',
};

const buttonStyle = {
    margin: 0,
    width: '100px',
};

const jogMachine = ({ axis, value }) => {
    const { jog } = store.get('widgets.axes');
    // const units = store.get('workspace.units');
    // const modal = units === 'mm' ? 'G21' : 'G20';
    const modal = 'G21';

    const commands = [
        `$J=${modal}G91 ${axis}${value} F${jog.feedrate}`,
    ];
    controller.command('gcode', commands, modal);
};

export const step1 = [
    {
        id: 0,
        checked: false,
        hasBeenChanged: false,
        label: () => {
            return <span>Mark Point 1</span>;
        },
        shapeActions: [
            {
                shapeType: 'circlePoints',
                shapeID: 0,
                isActive: true,
                show: true,
                clearPrevious: true,
                label: '1'
            },
        ],
        description: 'The red ‘X’ at the bottom left of the triangle indicates the location your CNC should be at right now. Use your first piece of tape and place it onto the wasteboard, directly under where your tool tip is.'
    },
    {
        id: 1,
        checked: false,
        hasBeenChanged: false,
        hideCompleteButton: true,
        label: ({ isCurrentAction, onChange }) => {
            const [val, setVal] = useState(100);
            const [didClick, setDidClick] = useState(false);

            const AXIS = 'X';

            const handleClick = () => {
                setDidClick(true); //Disable button
                jogMachine({ axis: AXIS, value: val });
                onChange({ axis: AXIS.toLowerCase(), value: val });
            };

            return (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button
                        primary
                        disabled={!isCurrentAction || didClick}
                        style={buttonStyle}
                        onClick={handleClick}
                    >
                        Move X-Axis
                    </Button>{' '}
                    <Input
                        className={styles.actionInput}
                        style={inputStyle}
                        disabled={!isCurrentAction}
                        units="mm"
                        value={val}
                        onChange={(e) => setVal(e.target.value)}
                        additionalProps={{ type: 'number' }}
                    />
                </div>
            );
        },
        shapeActions: [
            {
                shapeType: 'arrows',
                shapeID: 0,
                isActive: true,
                show: true,
                clearPrevious: true,
                label: 'X-Axis Movement'
            },
        ],
        description: 'Moving to the second point will happen in the X-axis. You can use the default value or enter your own value if you wish. Click the “Move X-Axis” button once you’re ready.'
    },
    {
        id: 2,
        checked: false,
        hasBeenChanged: false,
        label: () => {
            return <span>Mark Point 2</span>;
        },
        shapeActions: [
            {
                shapeType: 'circlePoints',
                shapeID: 1,
                isActive: true,
                show: true,
                clearPrevious: true,
                label: '2',
            },
        ],
        description: 'Now mark the second location with your second piece of tape.'
    },
    {
        id: 3,
        checked: false,
        hasBeenChanged: false,
        hideCompleteButton: true,
        label: ({ isCurrentAction, onChange }) => {
            const [val, setVal] = useState(100);
            const [didClick, setDidClick] = useState(false);

            const AXIS = 'Y';

            const handleClick = () => {
                setDidClick(true); //Disable button
                jogMachine({ axis: AXIS, value: val });
                onChange({ axis: AXIS.toLowerCase(), value: val });
            };

            return (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button
                        primary
                        disabled={!isCurrentAction || didClick}
                        style={buttonStyle}
                        onClick={handleClick}
                    >
                        Move Y-Axis
                    </Button>{' '}
                    <Input
                        className={styles.actionInput}
                        style={inputStyle}
                        disabled={!isCurrentAction}
                        units="mm"
                        value={val}
                        onChange={(e) => setVal(e.target.value)}
                        additionalProps={{ type: 'number' }}
                    />
                </div>
            );
        },
        shapeActions: [
            {
                shapeType: 'arrows',
                shapeID: 1,
                isActive: true,
                show: true,
                clearPrevious: true,
                label: 'Y-Axis Movement'
            },
        ],
        description: 'Moving to the third point will happen in the Y-axis. You can use the default value or enter your own value if you wish. Click the “Move Y-Axis” button once you’re ready.'
    },
    {
        id: 4,
        checked: false,
        hasBeenChanged: false,
        label: () => {
            return <span>Mark Point 3</span>;
        },
        shapeActions: [
            {
                shapeType: 'circlePoints',
                shapeID: 2,
                isActive: true,
                show: true,
                clearPrevious: true,
                label: '3',
            },
        ],
        description: 'This will be your last mark with the last piece of tape. Hitting the button to complete this step will enable you to move on to making your measurements.'
    },
];

export const step2 = [
    {
        id: 0,
        checked: false,
        hasBeenChanged: false,
        label: () => {
            return <span>Measure and Record the Distance Between Points <strong>1</strong> and <strong>2</strong></span>;
        },
        shapeActions: [
            {
                shapeType: 'arrows',
                shapeID: 0,
                isActive: true,
                show: true,
                label: ({ triangle, onTriangleChange }) => {
                    return (
                        <Input
                            className={styles.actionInput}
                            style={inputStyle}
                            units="mm"
                            value={triangle.a}
                            onChange={(e) => onTriangleChange({ id: 'a', value: e.target.value })}
                            additionalProps={{ type: 'number' }}
                        />
                    );
                }
            },
            {
                shapeType: 'circlePoints',
                shapeID: 0,
                isActive: false,
                show: true,
                label: '1',
            },
            {
                shapeType: 'circlePoints',
                shapeID: 1,
                isActive: false,
                show: true,
                label: '2',
            },
        ],
        description: 'Measure the distance between points 1 and 2 and record it into the distance entry box.'
    },
    {
        id: 1,
        checked: false,
        hasBeenChanged: false,
        label: () => {
            return <span>Measure and Record the Distance Between Points <strong>2</strong> and <strong>3</strong></span>;
        },
        shapeActions: [
            {
                shapeType: 'arrows',
                shapeID: 1,
                isActive: true,
                show: true,
                clearPrevious: true,
                label: ({ triangle, onTriangleChange }) => (
                    <Input
                        className={styles.actionInput}
                        style={inputStyle}
                        units="mm"
                        value={triangle.b}
                        onChange={(e) => onTriangleChange({ id: 'b', value: e.target.value })}
                        additionalProps={{ type: 'number' }}
                    />
                )
            },
            {
                shapeType: 'circlePoints',
                shapeID: 2,
                isActive: false,
                show: true,
                label: '3',
            },
        ],
        description: 'Now measure the distance between points 2 and 3 and record it into the distance entry box.'
    },
    {
        id: 2,
        checked: false,
        hasBeenChanged: false,
        label: () => {
            return <span>Measure and Record the Distance Between Points <strong>3</strong> and <strong>1</strong></span>;
        },
        shapeActions: [
            {
                shapeType: 'arrows',
                shapeID: 2,
                isActive: true,
                show: true,
                clearPrevious: true,
                label: ({ triangle, onTriangleChange }) => (
                    <Input
                        className={styles.actionInput}
                        style={inputStyle}
                        units="mm"
                        value={triangle.c}
                        onChange={(e) => onTriangleChange({ id: 'c', value: e.target.value })}
                        additionalProps={{ type: 'number' }}
                    />
                )
            },
        ],
        description: 'Lastly, measure the distance between points 3 and 1 and record it into the distance entry box. The next page will show you the results of how square your CNC currently is and provide feedback on how to fix it if it needs some adjustment.'
    },
];
