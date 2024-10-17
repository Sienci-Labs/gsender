import React, { useContext } from 'react';

import store from 'app/store';
import { FILE_TYPE, WORKSPACE_MODE } from 'app/constants';
import { Toaster, TOASTER_INFO } from 'app/lib/toaster/ToasterLib';
import { updateWorkspaceMode } from 'app/lib/rotary';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from 'app/components/shadcn/Dialog';

import Button from 'app/components/Button';

import standardTrackGraphic from '../assets/standard-track-top-view.png';
import extensionTrackGraphic from '../assets/extension-track-top-view.png';
import customTrackGraphic from '../assets/custom-boring-track-top-view.png';

import { HOLE_TYPES, EIGHTH, QUARTER, SIX, TEN } from '../constant';
import { RotaryContext } from '../Context';
import {
    CLOSE_ACTIVE_DIALOG,
    UPDATE_PHYSICAL_UNIT_SETUP,
} from '../Context/actions';

const PhysicalUnitSetup = ({ actions }) => {
    const {
        state: { physicalUnitSetup },
        dispatch,
    } = useContext(RotaryContext);
    const { linesUp, drillBitDiameter, holeCount } = physicalUnitSetup;

    const onSubmit = () => {
        let gcode;
        let localHoleCount = holeCount;

        // ¼" diameter endmill milling 2 holes for custom mounting solution
        if (!linesUp && drillBitDiameter === QUARTER) {
            gcode = HOLE_TYPES.DOESNT_LINE_UP_QUARTER;
            localHoleCount = 2;

            // ⅛" diameter endmill milling 2 holes for custom mounting solution
        } else if (!linesUp && drillBitDiameter === EIGHTH) {
            gcode = HOLE_TYPES.DOESNT_LINE_UP_EIGHTH;
            localHoleCount = 2;

            // ¼" diameter endmill milling 6 holes for 30" track
        } else if (drillBitDiameter === QUARTER && holeCount === SIX) {
            gcode = HOLE_TYPES.QUARTER_INCH_SIX_HOLES;

            // ⅛" diameter endmill milling 6 holes for 30" track
        } else if (drillBitDiameter === EIGHTH && holeCount === SIX) {
            gcode = HOLE_TYPES.EIGHTH_INCH_SIX_HOLES;

            // ¼" diameter endmill milling 10 holes for 30" track with extension
        } else if (drillBitDiameter === QUARTER && holeCount === TEN) {
            gcode = HOLE_TYPES.QUARTER_INCH_TEN_HOLES;

            // ⅛" diameter endmill milling 10 holes for 30" track with extension
        } else if (drillBitDiameter === EIGHTH && holeCount === TEN) {
            gcode = HOLE_TYPES.EIGHTH_INCH_TEN_HOLES;
        }

        actions.loadGcode(gcode);
        handleModalClose();
        Toaster.pop({
            msg: `File added for ${localHoleCount} ${drillBitDiameter}" mounting holes`,
            type: TOASTER_INFO,
        });
    };

    const handleModalClose = () => {
        dispatch({ type: CLOSE_ACTIVE_DIALOG });
    };

    const handleLinesUpSelection = (linesUp) => {
        dispatch({ type: UPDATE_PHYSICAL_UNIT_SETUP, payload: { linesUp } });
    };

    const handleDiameterSelection = (drillBitDiameter) => {
        dispatch({
            type: UPDATE_PHYSICAL_UNIT_SETUP,
            payload: { drillBitDiameter },
        });
    };

    const handleDrillCountSelection = (holeCount) => {
        dispatch({ type: UPDATE_PHYSICAL_UNIT_SETUP, payload: { holeCount } });
    };

    const handleDisableRotaryMode = () => {
        updateWorkspaceMode(FILE_TYPE.DEFAULT);
        Toaster.pop({
            msg: 'Rotary Mode Disabled',
            type: TOASTER_INFO,
        });
    };

    const getIllustrationImage = () => {
        if (!linesUp) {
            return customTrackGraphic;
        }

        if (holeCount === SIX) {
            return standardTrackGraphic;
        }

        if (holeCount === TEN) {
            return extensionTrackGraphic;
        }

        return standardTrackGraphic;
    };

    const workspaceMode = store.get('workspace.mode');

    return (
        <Dialog open={true} onOpenChange={handleModalClose}>
            <DialogContent className="bg-white w-full">
                <DialogHeader>
                    <DialogTitle>Rotary Mounting Setup</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col justify-between h-full">
                    <div>
                        {workspaceMode === WORKSPACE_MODE.ROTARY && (
                            <div className="mb-3 flex flex-col justify-center">
                                <div className="bg-red-600 bg-opacity-90 p-4 mb-3 text-white text-center">
                                    Rotary Mode is enabled, please disable it
                                    before proceeding.
                                </div>

                                <Button
                                    onClick={handleDisableRotaryMode}
                                    color="primary"
                                >
                                    Disable Rotary Mode
                                </Button>
                            </div>
                        )}
                        <p className="mb-3">
                            Make sure your router is mounted as far down as
                            possible with the bit inserted not too far into the
                            collet to prevent bottoming out.
                        </p>

                        <div className="mt-8">
                            <div className="mb-2">
                                Does the mounting track lineup without any
                                interference?
                            </div>
                            <div className="flex items-center">
                                <label className="mr-2">
                                    <input
                                        type="radio"
                                        name="linesUp"
                                        value="true"
                                        checked={linesUp === true}
                                        onChange={() =>
                                            handleLinesUpSelection(true)
                                        }
                                    />
                                    Lines up
                                </label>
                                <label className="mr-2">
                                    <input
                                        type="radio"
                                        name="linesUp"
                                        value="false"
                                        checked={linesUp === false}
                                        onChange={() =>
                                            handleLinesUpSelection(false)
                                        }
                                    />
                                    Does not lineup
                                </label>
                            </div>
                        </div>

                        <div className="mt-8">
                            <div className="mb-2">End Mill Diameter</div>
                            <div className="flex items-center">
                                <label className="mr-2">
                                    <input
                                        type="radio"
                                        name="drillBitDiameter"
                                        value={QUARTER}
                                        checked={drillBitDiameter === QUARTER}
                                        onChange={() =>
                                            handleDiameterSelection(QUARTER)
                                        }
                                    />
                                    1/4"
                                </label>
                                <label className="mr-2">
                                    <input
                                        type="radio"
                                        name="drillBitDiameter"
                                        value={EIGHTH}
                                        checked={drillBitDiameter === EIGHTH}
                                        onChange={() =>
                                            handleDiameterSelection(EIGHTH)
                                        }
                                    />
                                    1/8"
                                </label>
                            </div>
                        </div>

                        <div className={`mt-8 ${!linesUp ? 'opacity-50' : ''}`}>
                            <div className="mb-2">Number of holes</div>
                            <div className="flex items-center">
                                <label className="mr-2">
                                    <input
                                        type="radio"
                                        name="holeCount"
                                        value={SIX}
                                        checked={holeCount === SIX}
                                        onChange={() =>
                                            handleDrillCountSelection(SIX)
                                        }
                                        disabled={!linesUp}
                                    />
                                    6
                                </label>
                                <label className="mr-2">
                                    <input
                                        type="radio"
                                        name="holeCount"
                                        value={TEN}
                                        checked={holeCount === TEN}
                                        onChange={() =>
                                            handleDrillCountSelection(TEN)
                                        }
                                        disabled={!linesUp}
                                    />
                                    10
                                </label>
                            </div>
                        </div>
                    </div>

                    <img
                        className="w-full h-auto"
                        src={getIllustrationImage()}
                        alt=""
                    />

                    <Button
                        icon="fas fa-play"
                        className="w-1/2 mx-auto"
                        onClick={onSubmit}
                        color="primary"
                    >
                        Send to Visualizer
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PhysicalUnitSetup;
