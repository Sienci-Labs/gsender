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
            return <span>Mark Location 1</span>;
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
        description: 'This is the initial mark you will make. Like mentioned before, marking is simply drawing an X on a piece of tape and placing it on your wasteboard. In this instance, you would put it directly under where your cutting bit is where the end of the bit is pointing directly of the middle of the X you drew.'
    },
    {
        id: 1,
        checked: false,
        hasBeenChanged: false,
        hideCompleteButton: true,
        label: ({ isCurrentAction, onChange }) => {
            const [val, setVal] = useState(-100);
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
                shapeID: 0,
                isActive: true,
                show: true,
                clearPrevious: true,
                label: 'Y-Axis Movement'
            },
        ],
        description: 'Here you will jog your machine down in the Y-axis, in the distance given which is customizable. Once you are ready, click the "Move Y-Axis" button.'
    },
    {
        id: 2,
        checked: false,
        hasBeenChanged: false,
        label: () => {
            return <span>Mark Location 2</span>;
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
        description: 'You will mark your machine here once again where you must place the piece tape directly under the cutting bit and make sure the end of the bit is pointing directly of the middle of the X.'
    },
    {
        id: 3,
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
                shapeID: 1,
                isActive: true,
                show: true,
                clearPrevious: true,
                label: 'X-Axis Movement'
            },
        ],
        description: 'Here you will jog your machine in the X-axis going right, in the distance given which is customizable. Once you are ready, click the "Move X-Axis" button.'
    },
    {
        id: 4,
        checked: false,
        hasBeenChanged: false,
        label: () => {
            return <span>Mark Location 3</span>;
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
        description: 'Here you will make one last mark. Once you\'ve done so, you may check off this step off and proceed to the next page'
    },
];

export const step2 = [
    {
        id: 0,
        checked: false,
        hasBeenChanged: false,
        label: () => {
            return <span>Measure and Record the Distance Between Location <strong>1</strong> and <strong>2</strong></span>;
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
        description: 'Measure the distance between the Location 1 and 2 and enter in the amount in the input beside the flashing arrow'
    },
    {
        id: 1,
        checked: false,
        hasBeenChanged: false,
        label: () => {
            return <span>Measure and Record the Distance Between Location <strong>2</strong> and <strong>3</strong></span>;
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
        ],
        description: 'Measure the distance between the Location 2 and 3 and enter in the amount in the input beside the flashing arrow'
    },
    {
        id: 2,
        checked: false,
        hasBeenChanged: false,
        label: () => {
            return <span>Measure and Record the Distance Between Location <strong>3</strong> and <strong>1</strong></span>;
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
            {
                shapeType: 'circlePoints',
                shapeID: 2,
                isActive: false,
                show: true,
                label: '3',
            },
        ],
        description: 'Measure the distance between the Location 3 and 1 and enter in the amount in the input beside the flashing arrow'
    },
];
