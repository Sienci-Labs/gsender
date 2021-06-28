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
        label: ({ isCurrentAction }) => {
            const [val, setVal] = useState(100);
            const [didClick, setDidClick] = useState(false);

            const handleClick = () => {
                const { wpos } = controller?.state?.status;

                const value = (Number(wpos.y) - Number(val)).toFixed(3);

                setDidClick(true); //Disable button
                controller.command('gcode', `G0 Y${value}`);
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
        description: 'Here you will jog your machine in the Y-axis in the distance given which is customizable. Once you are ready, click the "Move Y-Axis" button.'
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
        description: 'Mark your machine here by placing the piece of tape directly under the cutting bit and make sure the end of the bit is pointing directly to the middle of the X.'
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
        description: 'Here you will make one last mark using the tape. Once you\'ve done so, you may check off this step off and proceed to the next page'
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

export const axisSteps = {
    x: xAxisStep,
    y: yAxisStep,
};
