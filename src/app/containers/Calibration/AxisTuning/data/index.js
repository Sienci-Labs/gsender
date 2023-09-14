/* eslint-disable react/prop-types */
import React, { useState } from 'react';

import controller from 'app/lib/controller';
import Button from 'app/components/FunctionButton/FunctionButton';
import store from 'app/store';

import x1 from '../assets/X_axis-calibration_1.png';
import x2 from '../assets/X_axis-calibration_2.png';
import y1 from '../assets/Y_axis-calibration_1.png';
import y2 from '../assets/Y_axis-calibration_2.png';
import z1 from '../assets/Z_axis-calibration_1.png';
import z2 from '../assets/Z_axis-calibration_2.png';

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
    const modal = 'G21';

    const commands = [
        `$J=${modal}G91 ${axis}${value} F${jog.feedrate}`,
    ];
    controller.command('gcode', commands, modal);
};

export const yAxisStep = [
    {
        id: 0,
        checked: false,
        hasBeenChanged: false,
        image: y1,
        label: () => {
            return <span>Mark first location</span>;
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
        description: 'First, mark next to the gantry in the location shown with your marker, pencil, or using a strip of tape.'
    },
    {
        id: 1,
        checked: false,
        hasBeenChanged: false,
        hideCompleteButton: true,
        image: y1,
        label: ({ isCurrentAction, onChange, setRequestedDistance }) => {
            const [val, setVal] = useState(100);
            const [didClick, setDidClick] = useState(false);
            const AXIS = 'Y';

            const handleClick = () => {
                const value = Math.abs(val);
                setRequestedDistance(value);
                setDidClick(true); //Disable button
                jogMachine({ axis: AXIS, value: value });
                onChange({ axis: AXIS.toLowerCase(), value: value });
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
        description: 'Now move any distance you wish. A larger value will better tune your movement just make sure you don’t hit your machine limits. ' +
            'Once you are ready, click the “Move Y-Axis” button.'
    },
    {
        id: 2,
        checked: false,
        hasBeenChanged: false,
        hideCompleteButton: true,
        image: y2,
        label: ({ isCurrentAction, onChange, options, setActualDistance }) => {
            const [val, setVal] = useState(100);
            const AXIS = 'Y';

            const handleClick = () => {
                const value = Math.abs(val);
                setActualDistance(value);
                onChange({ axis: AXIS.toLowerCase(), value: value });
            };

            return (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button
                        disabled={!isCurrentAction}
                        style={buttonStyle}
                        onClick={handleClick}
                    >
                        Set travel
                    </Button>
                    <Input
                        className={styles.actionInput}
                        style={inputStyle}
                        disabled={!isCurrentAction}
                        units="mm"
                        value={val}
                        onChange={(e) => {
                            setVal(e.target.value);
                        }}
                        additionalProps={{ type: 'number' }}
                    />
                </div>

            );
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
        description: 'Lastly, measure the distance travelled between the original mark and the current gantry location. Take your time when entering this value, a more accurate measurement will give you better tuning results.'
    },
];

export const xAxisStep = [
    {
        id: 0,
        checked: false,
        hasBeenChanged: false,
        image: x1,
        label: () => {
            return <span>Mark first location</span>;
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
        description: 'First, mark next to the gantry in the location shown with your marker, pencil, or using a strip of tape.'
    },
    {
        id: 1,
        checked: false,
        hasBeenChanged: false,
        hideCompleteButton: true,
        image: x1,
        label: ({ isCurrentAction, onChange, setRequestedDistance }) => {
            const [val, setVal] = useState(100);
            const [didClick, setDidClick] = useState(false);
            const AXIS = 'X';

            const handleClick = () => {
                setRequestedDistance(val);
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
        description: 'Now move any distance you wish. A larger value will better tune your movement just make sure you don’t hit your machine limits. ' +
            'Once you are ready, click the “Move X-Axis” button.'
    },
    {
        id: 2,
        checked: false,
        hasBeenChanged: false,
        hideCompleteButton: true,
        image: x2,
        label: ({ isCurrentAction, onChange, options, setActualDistance }) => {
            const [val, setVal] = useState(100);
            const AXIS = 'X';

            const handleClick = () => {
                const value = Math.abs(val);
                setActualDistance(value);
                onChange({ axis: AXIS.toLowerCase(), value: value });
            };

            return (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button
                        disabled={!isCurrentAction}
                        style={buttonStyle}
                        onClick={handleClick}
                    >
                        Set travel
                    </Button>
                    <Input
                        className={styles.actionInput}
                        style={inputStyle}
                        disabled={!isCurrentAction}
                        units="mm"
                        value={val}
                        onChange={(e) => {
                            setVal(e.target.value);
                        }}
                        additionalProps={{ type: 'number' }}
                    />
                </div>

            );
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
        description: 'Lastly, measure the distance travelled between the original mark and the current gantry location. Take your time when entering this value, a more accurate measurement will give you better tuning results.'
    },
];

export const zAxisStep = [
    {
        id: 0,
        checked: false,
        hasBeenChanged: false,
        image: z1,
        label: () => {
            return <span>Mark first location</span>;
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
        description: 'First, mark next to the gantry in the location shown with your marker, pencil, or using a strip of tape.'
    },
    {
        id: 1,
        checked: false,
        hasBeenChanged: false,
        hideCompleteButton: true,
        image: z1,
        label: ({ isCurrentAction, onChange, setRequestedDistance }) => {
            const [val, setVal] = useState(30);
            const [didClick, setDidClick] = useState(false);
            const AXIS = 'Z';

            const handleClick = () => {
                setRequestedDistance(val);
                setDidClick(true); //Disable button
                const value = Math.abs(val) * -1;
                jogMachine({ axis: AXIS, value });
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
                        Move Z-Axis
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
                label: 'Z-Axis Movement'
            },
        ],
        description: 'Now move any distance you wish. A larger value will better tune your movement just make sure you don’t hit your machine limits. ' +
            'Once you are ready, click the “Move Z-Axis” button.'
    },
    {
        id: 2,
        checked: false,
        hasBeenChanged: false,
        hideCompleteButton: true,
        image: z2,
        label: ({ isCurrentAction, onChange, options, setActualDistance }) => {
            const [val, setVal] = useState(30);
            const AXIS = 'Z';

            const handleClick = () => {
                setActualDistance(val);
                onChange({ axis: AXIS.toLowerCase(), value: val });
            };

            return (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button
                        disabled={!isCurrentAction}
                        style={buttonStyle}
                        onClick={handleClick}
                    >
                        Set travel
                    </Button>
                    <Input
                        className={styles.actionInput}
                        style={inputStyle}
                        disabled={!isCurrentAction}
                        units="mm"
                        value={val}
                        onChange={(e) => {
                            setVal(e.target.value);
                        }}
                        additionalProps={{ type: 'number' }}
                    />
                </div>

            );
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
        description: 'Lastly, measure the distance travelled between the original mark and the current gantry location. Take your time when entering this value, a more accurate measurement will give you better tuning results.'
    },
];

export const axisSteps = {
    x: xAxisStep,
    y: yAxisStep,
    z: zAxisStep
};
