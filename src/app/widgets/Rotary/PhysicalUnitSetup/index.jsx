/* eslint-disable no-unused-vars */
import React from 'react';
import Modal from 'app/components/ToolModal/ToolModal';
import { RadioGroup, RadioButton } from 'app/components/Radio';
import ToolModalButton from 'app/components/ToolModalButton/ToolModalButton';
import { Toaster, TOASTER_INFO } from 'app/lib/toaster/ToasterLib';
import styled from '@emotion/styled';
import styles from './index.styl';
import { DOESNT_LINE_UP, EIGHTH, LINES_UP, QUARTER, SIX, TWELVE, TWO } from './constant';

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
    margin-top: 3rem;
    color: #6b7280;
`;

const PhysicalUnitSetup = ({ actions: rotaryActions, physicalSetupState, setPhysicalSetupState }) => {
    const { showDialogue, linesUp, drillDiameter, holeCount } = physicalSetupState;

    const actions = {
        handleSubmit: () => {
            if (linesUp === DOESNT_LINE_UP) {
                // rotaryActions.startContinuousJog(params)
                actions.handleModalClose();
                Toaster.pop({
                    msg: `Drilling 2 ${drillDiameter}” mounting holes`,
                    type: TOASTER_INFO,
                });
                return;
            }
            // ¼” diameter endmill milling 6 holes for 30” track
            if (drillDiameter === QUARTER && holeCount === SIX) {
                // rotaryActions.startContinuousJog(params)
                actions.handleModalClose();
                Toaster.pop({
                    msg: `Drilling ${holeCount} ${drillDiameter}” mounting holes`,
                    type: TOASTER_INFO,
                });
                return;
            }
            // ⅛” diameter endmill milling 6 holes for 30” track
            if (drillDiameter === EIGHTH && holeCount === SIX) {
                // rotaryActions.startContinuousJog(params)
                actions.handleModalClose();
                Toaster.pop({
                    msg: `Drilling ${holeCount} ${drillDiameter}” mounting holes`,
                    type: TOASTER_INFO,
                });
                return;
            }
            // ¼” diameter endmill milling 12 holes for 30” track with extension
            if (drillDiameter === QUARTER && holeCount === TWELVE) {
                // rotaryActions.startContinuousJog(params)
                actions.handleModalClose();
                Toaster.pop({
                    msg: `Drilling ${holeCount} ${drillDiameter}” mounting holes`,
                    type: TOASTER_INFO,
                });
                return;
            }
            // ⅛” diameter endmill milling 12 holes for 30” track with extension
            if (drillDiameter === EIGHTH && holeCount === TWELVE) {
                // rotaryActions.startContinuousJog(params)
                actions.handleModalClose();
                Toaster.pop({
                    msg: `Drilling ${holeCount} ${drillDiameter}” mounting holes`,
                    type: TOASTER_INFO,
                });
                return;
            }
            // ¼” diameter endmill milling 2 holes for custom mounting solution
            if (drillDiameter === QUARTER && holeCount === TWO) {
                // rotaryActions.startContinuousJog(params)
                actions.handleModalClose();
                Toaster.pop({
                    msg: `Drilling ${holeCount} ${drillDiameter}” mounting holes`,
                    type: TOASTER_INFO,
                });
                return;
            }
            // ⅛” diameter endmill milling 2 holes for custom mounting solution
            if (drillDiameter === EIGHTH && holeCount === TWO) {
                // rotaryActions.startContinuousJog(params)
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
            setPhysicalSetupState((prev) => ({ ...prev, drillDiameter: value }));
        },
        handleDrillCountSelection: (value, event) => {
            setPhysicalSetupState((prev) => ({ ...prev, holeCount: value }));
        },
    };

    return (
        <Modal
            title="Physical Rotary-unit Setup" show={showDialogue} onClose={actions.handleModalClose}
            size="sm"
        >
            <ContentWrapper>
                <Option>
                    <MenuTitle>Does the mounting track lineup without any interference?</MenuTitle>
                    <RadioGroup
                        value={linesUp}
                        depth={2}
                        onChange={actions.handleLinesUpSelection}
                        size="small"
                    >
                        <RadioWrapper style={{ marginTop: '0.6rem' }}>
                            <RadioButton className={styles.radio} label="Lines up" value={LINES_UP} />
                            <RadioButton className={styles.radio} label="Does not line up" value={DOESNT_LINE_UP} />
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
                            <RadioButton className={styles.radio} label="1/4”" value={QUARTER} />
                            <RadioButton className={styles.radio} label="1/8”" value={EIGHTH} />
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
                                <RadioButton className={styles.radio} label="6" value={SIX} />
                                <RadioButton className={styles.radio} label="12" value={TWELVE} />
                            </RadioWrapper>
                        </RadioGroup>
                    </Option>
                )}
                {
                    linesUp === DOESNT_LINE_UP && (
                        <Description>
                            In the case where the mounting track does not lineup,
                            you may please select the correct options above to
                            manually drill a pair of mounting holes at safe locations
                            on the wasteboard.
                        </Description>
                    )
                }
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
