import React from 'react';
import PropTypes from 'prop-types';

import { AVAILABILITY_TYPES } from '../utils';
import Listener from './Listener';

const { DEFAULT, AVAILABLE, UNAVAILABLE, IS_THE_SAME } = AVAILABILITY_TYPES;

const ButtonsPressed = ({ shortcut }) => {
    if (!shortcut) {
        return null;
    }
    return (
        <div>
            Button Combo:{' '}
            {shortcut.map((item, i) =>
                i === 0 ? (
                    <strong key={item.buttonIndex}>{item.buttonIndex}</strong>
                ) : (
                    <React.Fragment key={item.buttonIndex}>
                        {' '}
                        and <strong>{item.buttonIndex}</strong>
                    </React.Fragment>
                ),
            )}
        </div>
    );
};
ButtonsPressed.propTypes = { shortcut: PropTypes.array };

const Availability = ({ type, shortcutTitle, shortcut, listenerRef }) => {
    const output = {
        [DEFAULT]: (
            <div className="flex flex-col items-center gap-2 text-center p-4">
                <i className="fas fa-info-circle text-blue-500 text-xl" />
                <p>Press any button or button combination on your gamepad</p>
            </div>
        ),
        [AVAILABLE]: (
            <div className="flex flex-col items-center gap-2 text-center p-4 text-green-600">
                <i className="fas fa-check-circle text-xl" />
                <p className="m-0">Shortcut is Availabile</p>
                <ButtonsPressed shortcut={shortcut} />
            </div>
        ),
        [UNAVAILABLE]: (
            <div className="flex flex-col items-center gap-2 text-center p-4 text-red-600">
                <i className="fas fa-times-circle text-xl" />
                <p className="m-0">Shortcut Already Exists on an Action</p>
                <ButtonsPressed shortcut={shortcut} />
            </div>
        ),
        [IS_THE_SAME]: (
            <div className="flex flex-col items-center gap-2 text-center p-4 text-blue-500">
                <i className="fas fa-info-circle text-xl" />
                <p className="m-0">
                    This is the Current Shortcut for This Action
                </p>
            </div>
        ),
    }[type];

    return (
        <div className="relative h-full">
            <span className="absolute top-[10px] left-[10px] bg-white bg-opacity-70 p-[10px] rounded">
                {shortcutTitle}
            </span>
            <Listener ref={listenerRef} />
            {output}
        </div>
    );
};

Availability.propTypes = {
    type: PropTypes.oneOf([DEFAULT, AVAILABLE, UNAVAILABLE, IS_THE_SAME]),
    shortcutTitle: PropTypes.string,
    shortcut: PropTypes.array,
    listenerRef: PropTypes.object,
};

export default Availability;
