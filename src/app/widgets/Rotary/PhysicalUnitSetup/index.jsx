/* eslint-disable no-unused-vars */
import React from 'react';
import Modal from 'app/components/ToolModal/ToolModal';
import { RadioGroup, RadioButton } from 'app/components/Radio';
import ToolModalButton from 'app/components/ToolModalButton/ToolModalButton';
import { Toaster, TOASTER_INFO } from 'app/lib/toaster/ToasterLib';
import GCodeParser from 'gcode-parser';
import styled from '@emotion/styled';
import quarterInchSixHoles from './SetupFiles/quarter_inch_six_holes_for_30_track.nc';
import eightInchSixHoles from './SetupFiles/eighth_inch_six_holes_for_30_track.nc';
import quarterInchTexHoles from './SetupFiles/quarter_inch_ten_holes_for_30_track_with_extension.nc';
import eightInchTenHoles from './SetupFiles/eighth_inch_ten_holes_for_30_track_with_extension.nc';
import doesNotLineupQuarter from './SetupFiles/quarter_inch_two_holes_for_custom_mounting_solution.nc';
import doesNotLineUpEighth from './SetupFiles/eighth_inch_two_holes_for_custom_mounting_solution.nc';
import styles from './index.styl';
import {
    DOESNT_LINE_UP,
    EIGHTH,
    LINES_UP,
    QUARTER,
    SIX,
    TEN,
    TWO,
} from '../constant';

const ContentWrapper = styled.div`
    padding: 0 2rem;
    height: 90%;
`;
const Option = styled.div`
    display: flex;
    margin-top: 1rem;
`;
const MenuTitle = styled.div`
    width: 50%;
`;
const RadioWrapper = styled.div`
    margin-left: 1rem;
    display: flex;
    align-items: center;
`;
const Submit = styled.div`
    position: absolute;
    bottom: 2rem;
    width: 100%;
    left: 0;
`;
const Description = styled.div`
    margin-top: 5rem;
    color: #6b7280;
    font-size: 1rem;
`;

const PhysicalUnitSetup = ({
    actions: rotaryActions,
    physicalSetupState,
    setPhysicalSetupState,
}) => {
    const { showDialogue, linesUp, drillDiameter, holeCount } =
        physicalSetupState;

    const actions = {
        readGCodeFile: async (file) => {
            try {
                const response = await fetch(file);
                const gcode = await response.text();
                return gcode;
            } catch (error) {
                throw error;
            }
        },
        parseGCodeFile: async (file) => {
            const gcode = await actions.readGCodeFile(file);
            const parser = new GCodeParser();
            const gcodeData = parser.parse(gcode);
            return gcodeData;
        },
        handleSubmit: () => {
            // ¼” diameter endmill milling 6 holes for 30” track
            if (drillDiameter === QUARTER && holeCount === SIX) {
                rotaryActions.loadGcode(actions.parseGCodeFile(quarterInchSixHoles));
                actions.handleModalClose();
                Toaster.pop({
                    msg: `Drilling ${holeCount} ${drillDiameter}” mounting holes`,
                    type: TOASTER_INFO,
                });
                return;
            }
            // ⅛” diameter endmill milling 6 holes for 30” track
            if (drillDiameter === EIGHTH && holeCount === SIX) {
                rotaryActions.loadGcode(actions.parseGCodeFile(eightInchSixHoles));
                actions.handleModalClose();
                Toaster.pop({
                    msg: `Drilling ${holeCount} ${drillDiameter}” mounting holes`,
                    type: TOASTER_INFO,
                });
                return;
            }
            // ¼” diameter endmill milling 10 holes for 30” track with extension
            if (drillDiameter === QUARTER && holeCount === TEN) {
                rotaryActions.loadGcode(actions.parseGCodeFile(quarterInchTexHoles));
                actions.handleModalClose();
                Toaster.pop({
                    msg: `Drilling ${holeCount} ${drillDiameter}” mounting holes`,
                    type: TOASTER_INFO,
                });
                return;
            }
            // ⅛” diameter endmill milling 10 holes for 30” track with extension
            if (drillDiameter === EIGHTH && holeCount === TEN) {
                rotaryActions.loadGcode(actions.parseGCodeFile(eightInchTenHoles));
                actions.handleModalClose();
                Toaster.pop({
                    msg: `Drilling ${holeCount} ${drillDiameter}” mounting holes`,
                    type: TOASTER_INFO,
                });
                return;
            }
            // ¼” diameter endmill milling 2 holes for custom mounting solution
            if (
                linesUp === DOESNT_LINE_UP &&
                drillDiameter === QUARTER &&
                holeCount === TWO
            ) {
                rotaryActions.loadGcode(actions.parseGCodeFile(doesNotLineupQuarter));
                actions.handleModalClose();
                Toaster.pop({
                    msg: `Drilling ${holeCount} ${drillDiameter}” mounting holes`,
                    type: TOASTER_INFO,
                });
                return;
            }
            // ⅛” diameter endmill milling 2 holes for custom mounting solution
            if (
                linesUp === DOESNT_LINE_UP &&
                drillDiameter === EIGHTH &&
                holeCount === TWO
            ) {
                rotaryActions.loadGcode(actions.parseGCodeFile(doesNotLineUpEighth));
                actions.handleModalClose();
                Toaster.pop({
                    msg: `Drilling ${holeCount} ${drillDiameter}” mounting holes`,
                    type: TOASTER_INFO,
                });
                return;
            }
        },
        handleModalClose: () => {
            setPhysicalSetupState((prev) => ({ ...prev, showDialogue: false }));
        },
        handleLinesUpSelection: (value, event) => {
            setPhysicalSetupState((prev) => ({ ...prev, linesUp: value }));
        },
        handleDiameterSelection: (value, event) => {
            setPhysicalSetupState((prev) => ({
                ...prev,
                drillDiameter: value,
            }));
        },
        handleDrillCountSelection: (value, event) => {
            setPhysicalSetupState((prev) => ({ ...prev, holeCount: value }));
        },
    };

    return (
        <Modal
            title="Physical Rotary-unit Setup"
            show={showDialogue}
            onClose={actions.handleModalClose}
            size="sm"
        >
            <ContentWrapper>
                <Option>
                    <MenuTitle>
                        Does the mounting track lineup without any interference?
                    </MenuTitle>
                    <RadioGroup
                        value={linesUp}
                        depth={2}
                        onChange={actions.handleLinesUpSelection}
                        size="small"
                    >
                        <RadioWrapper style={{ marginTop: '0.6rem' }}>
                            <RadioButton
                                className={styles.radio}
                                label="Lines up"
                                value={LINES_UP}
                            />
                            <RadioButton
                                className={styles.radio}
                                label="Does not lineup"
                                value={DOESNT_LINE_UP}
                            />
                        </RadioWrapper>
                    </RadioGroup>
                </Option>
                <Option>
                    <MenuTitle>Drill bit diameter</MenuTitle>
                    <RadioGroup
                        value={drillDiameter}
                        depth={2}
                        onChange={actions.handleDiameterSelection}
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
                {linesUp === LINES_UP && (
                    <Option>
                        <MenuTitle>Number of holes</MenuTitle>
                        <RadioGroup
                            value={holeCount}
                            depth={2}
                            onChange={actions.handleDrillCountSelection}
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
                )}
                {linesUp === DOESNT_LINE_UP && (
                    <Description>
                        In the case where the mounting track does not lineup,
                        you may please select the correct options above to
                        manually drill a pair of mounting holes at safe
                        locations on the wasteboard.
                    </Description>
                )}
                <Submit>
                    <ToolModalButton
                        icon="fas fa-play"
                        style={{ width: '50%', margin: 'auto' }}
                        onClick={actions.handleSubmit}
                    >
                        Send to Visualizer
                    </ToolModalButton>
                </Submit>
            </ContentWrapper>
        </Modal>
    );
};

export default PhysicalUnitSetup;
