import React, { useContext } from 'react';

import store from 'app/store';
import { FILE_TYPE, WORKSPACE_MODE } from 'app/constants';
import { Toaster, TOASTER_INFO } from 'app/lib/toaster/ToasterLib';
import { updateWorkspaceMode } from 'app/lib/rotary';
import Modal from 'app/components/ToolModal/ToolModal';
import { RadioGroup, RadioButton } from 'app/components/Radio';
import ToolModalButton from 'app/components/ToolModalButton/ToolModalButton';
import Button from 'app/components/FunctionButton/FunctionButton';

import standardTrackGraphic from '../assets/standard-track-top-view.png';
import extensionTrackGraphic from '../assets/extension-track-top-view.png';
import customTrackGraphic from '../assets/custom-boring-track-top-view.png';

import styles from './index.styl';
import { ContentWrapper, Option, MenuTitle, RadioWrapper, WarningBanner } from './styled';
import { HOLE_TYPES, EIGHTH, QUARTER, SIX, TEN, SHORT_TRACK, LONG_TRACK, } from '../constant';
import { RotaryContext } from '../Context';
import { CLOSE_ACTIVE_DIALOG, UPDATE_PHYSICAL_UNIT_SETUP } from '../Context/actions';

const PhysicalUnitSetup = ({ actions }) => {
    const { state: { physicalUnitSetup }, dispatch } = useContext(RotaryContext);
    const { linesUp, drillBitDiameter, holeCount, trackLength } = physicalUnitSetup;

    const onSubmit = () => {
        let gcode;
        let localHoleCount = holeCount;

        // ¼” diameter endmill milling 2 holes for custom mounting solution
        if (!linesUp && drillBitDiameter === QUARTER) {
            gcode = HOLE_TYPES.DOESNT_LINE_UP_QUARTER;
            localHoleCount = 2;

        // ⅛” diameter endmill milling 2 holes for custom mounting solution
        } else if (!linesUp && drillBitDiameter === EIGHTH) {
            gcode = HOLE_TYPES.DOESNT_LINE_UP_EIGHTH;
            localHoleCount = 2;

        // ¼” diameter endmill milling 6 holes for 30” track
        } else if (drillBitDiameter === QUARTER && holeCount === SIX) {
            gcode = HOLE_TYPES.QUARTER_INCH_SIX_HOLES;

        // ⅛” diameter endmill milling 6 holes for 30” track
        } else if (drillBitDiameter === EIGHTH && holeCount === SIX) {
            gcode = HOLE_TYPES.EIGHTH_INCH_SIX_HOLES;

        // ¼” diameter endmill milling 10 holes for 30” track with extension
        } else if (drillBitDiameter === QUARTER && holeCount === TEN && trackLength === LONG_TRACK) {
            gcode = HOLE_TYPES.QUARTER_INCH_TEN_HOLES;

        // ⅛” diameter endmill milling 10 holes for 30” track with extension
        } else if (drillBitDiameter === EIGHTH && holeCount === TEN && trackLength === LONG_TRACK) {
            gcode = HOLE_TYPES.EIGHTH_INCH_TEN_HOLES;
        } else if (drillBitDiameter === QUARTER && holeCount === TEN && trackLength === SHORT_TRACK) {
            gcode = HOLE_TYPES.QUARTER_INCH_TEN_HOLES_SHORT;
        // ⅛” diameter endmill milling 10 holes for 30” track with extension
        } else if (drillBitDiameter === EIGHTH && holeCount === TEN && trackLength === SHORT_TRACK) {
            gcode = HOLE_TYPES.EIGHTH_INCH_TEN_HOLES_SHORT;
        } else {
            console.assert('Invalid combination, check options');
        }

        actions.loadGcode(gcode);
        handleModalClose();
        Toaster.pop({
            msg: `File added for ${localHoleCount} ${drillBitDiameter}” mounting holes`,
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
        dispatch({ type: UPDATE_PHYSICAL_UNIT_SETUP, payload: { drillBitDiameter } });
    };

    const handleDrillCountSelection = (holeCount) => {
        dispatch({ type: UPDATE_PHYSICAL_UNIT_SETUP, payload: { holeCount } });
    };

    const handleTrackLengthSelection = (trackLength) => {
        dispatch({ type: UPDATE_PHYSICAL_UNIT_SETUP, payload: { trackLength } });
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
        <Modal
            title="Rotary Mounting Setup"
            onClose={handleModalClose}
            size="lg"
        >
            <ContentWrapper>
                <div>
                    {
                        workspaceMode === WORKSPACE_MODE.ROTARY && (
                            <>
                                <WarningBanner>
                                    Rotary Mode is enabled, please disable it before proceeding.
                                </WarningBanner>

                                <Button onClick={handleDisableRotaryMode}>Disable Rotary Mode</Button>
                            </>
                        )
                    }
                    <p style={{ fontWeight: 'bold' }}>Make sure your router is mounted as far down as possible with the bit inserted not too far into the collet to prevent bottoming out.</p>

                    <Option>
                        <MenuTitle>
                            Does the mounting track lineup without any interference?
                        </MenuTitle>
                        <RadioGroup
                            value={linesUp}
                            depth={2}
                            onChange={handleLinesUpSelection}
                            size="small"
                        >
                            <RadioWrapper>
                                <RadioButton
                                    className={styles.radio}
                                    label="Lines up"
                                    value={true}
                                />
                                <RadioButton
                                    className={styles.radio}
                                    label="Does not lineup"
                                    value={false}
                                />
                            </RadioWrapper>
                        </RadioGroup>
                    </Option>

                    <Option>
                        <MenuTitle>End Mill Diameter</MenuTitle>
                        <RadioGroup
                            value={drillBitDiameter}
                            depth={2}
                            onChange={handleDiameterSelection}
                            size="small"
                        >
                            <RadioWrapper>
                                <RadioButton
                                    className={styles.radio}
                                    label="1/4”"
                                    value={QUARTER}
                                />
                                <RadioButton
                                    className={styles.radio}
                                    label="1/8”"
                                    value={EIGHTH}
                                />
                            </RadioWrapper>
                        </RadioGroup>
                    </Option>

                    <Option disabled={!linesUp}>
                        <MenuTitle>Number of holes</MenuTitle>
                        <RadioGroup
                            value={holeCount}
                            depth={2}
                            onChange={handleDrillCountSelection}
                            size="small"
                        >
                            <RadioWrapper>
                                <RadioButton
                                    className={styles.radio}
                                    label="6"
                                    value={SIX}
                                />
                                <RadioButton
                                    className={styles.radio}
                                    label="10"
                                    value={TEN}
                                />
                            </RadioWrapper>
                        </RadioGroup>
                    </Option>

                    <Option disabled={holeCount !== TEN}>
                        <MenuTitle>Extension Track Length</MenuTitle>
                        <RadioGroup
                            value={trackLength}
                            depth={2}
                            onChange={handleTrackLengthSelection}
                            size="small"
                        >
                            <RadioWrapper>
                                <RadioButton
                                    className={styles.radio}
                                    label="400mm"
                                    value={SHORT_TRACK}
                                />
                                <RadioButton
                                    className={styles.radio}
                                    label="460mm"
                                    value={LONG_TRACK}
                                />
                            </RadioWrapper>
                        </RadioGroup>
                    </Option>
                </div>

                <img className={styles.graphic} src={getIllustrationImage()} alt="" />

                <ToolModalButton
                    icon="fas fa-play"
                    style={{ width: '50%', margin: '0 auto' }}
                    onClick={onSubmit}
                >
                    Send to Visualizer
                </ToolModalButton>
            </ContentWrapper>
        </Modal>
    );
};

export default PhysicalUnitSetup;
