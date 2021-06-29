/* eslint-disable react/prop-types */
import React, { useState } from 'react';

import controller from 'app/lib/controller';
import Button from 'app/components/FunctionButton/FunctionButton';
import store from 'app/store';

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
        description: 'Mark your machine here directly on the gantry at the current position using the edge of a piece of tape or pencil.'
    },
    {
        id: 1,
        checked: false,
        hasBeenChanged: false,
        hideCompleteButton: true,
        label: ({ isCurrentAction, onChange, setRequestedDistance }) => {
            const [val, setVal] = useState(100);
            const [didClick, setDidClick] = useState(false);
            const AXIS = 'Y';

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
        description: 'Here you will jog your machine in the Y-axis by a customizable distance.' +
            'Larger distances are better but make sure you don\'t hit your machine limits. Once you are ready, click the "Move Y-Axis" button.'
    },
    {
        id: 2,
        checked: false,
        hasBeenChanged: false,
        label: () => {
            return <span>Mark second location</span>;
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
        description: 'Here you will make one last mark on the gantry using the tape or pencil. Once you\'ve done so, you may check off this step off and proceed to the next page'
    },
    {
        id: 3,
        checked: false,
        hasBeenChanged: false,
        hideCompleteButton: true,
        label: ({ isCurrentAction, onChange, options, setActualDistance }) => {
            const [val, setVal] = useState(100);
            const AXIS = 'Y';

            const handleClick = () => {
                setActualDistance(val);
                onChange({ axis: AXIS.toLowerCase(), value: val });
            };

            return (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button
                        primary
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
        description: 'Measure the distance travelled between point A and point B and enter it in the provided input.  The more accurate the measurement, the more accurate the motor calibration will be.'
    },
];

export const xAxisStep = [
    {
        id: 0,
        checked: false,
        hasBeenChanged: false,
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
        description: 'Mark your machine here directly on the gantry at the current position using the edge of a piece of tape or pencil.'
    },
    {
        id: 1,
        checked: false,
        hasBeenChanged: false,
        hideCompleteButton: true,
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
        description: 'Here you will jog your machine in the X-axis by a customizable distance.' +
            'Larger distances are better but make sure you don\'t hit your machine limits. Once you are ready, click the "Move X-Axis" button.'
    },
    {
        id: 2,
        checked: false,
        hasBeenChanged: false,
        label: () => {
            return <span>Mark second location</span>;
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
        description: 'Here you will make one last mark on the gantry using the tape or pencil. Once you\'ve done so, you may check off this step off and proceed to the next page'
    },
    {
        id: 3,
        checked: false,
        hasBeenChanged: false,
        hideCompleteButton: true,
        label: ({ isCurrentAction, onChange, options, setActualDistance }) => {
            const [val, setVal] = useState(100);
            const AXIS = 'X';

            const handleClick = () => {
                setActualDistance(val);
                onChange({ axis: AXIS.toLowerCase(), value: val });
            };

            return (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button
                        primary
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
        description: 'Measure the distance travelled between point A and point B and enter it in the provided input.  The more accurate the measurement, the more accurate the motor calibration will be.'
    },
];

export const zAxisStep = [
    {
        id: 0,
        checked: false,
        hasBeenChanged: false,
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
        description: 'Mark your machine here directly on the gantry at the current position using the edge of a piece of tape or pencil.'
    },
    {
        id: 1,
        checked: false,
        hasBeenChanged: false,
        hideCompleteButton: true,
        label: ({ isCurrentAction, onChange, setRequestedDistance }) => {
            const [val, setVal] = useState(30);
            const [didClick, setDidClick] = useState(false);
            const AXIS = 'Z';

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
        description: 'Here you will jog your machine in the Z-axis by a customizable distance.' +
            'Larger distances are better but make sure you don\'t hit your machine limits. Once you are ready, click the "Move Z-Axis" button.'
    },
    {
        id: 2,
        checked: false,
        hasBeenChanged: false,
        label: () => {
            return <span>Mark second location</span>;
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
        description: 'Here you will make one last mark on the gantry using the tape or pencil. Once you\'ve done so, you may check off this step off and proceed to the next page'
    },
    {
        id: 3,
        checked: false,
        hasBeenChanged: false,
        hideCompleteButton: true,
        label: ({ isCurrentAction, onChange, options, setActualDistance }) => {
            const [val, setVal] = useState(100);
            const AXIS = 'Z';

            const handleClick = () => {
                setActualDistance(val);
                onChange({ axis: AXIS.toLowerCase(), value: val });
            };

            return (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button
                        primary
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
        description: 'Measure the distance travelled between point A and point B and enter it in the provided input.  The more accurate the measurement, the more accurate the motor calibration will be.'
    },
];

export const axisSteps = {
    x: xAxisStep,
    y: yAxisStep,
    z: zAxisStep
};
