import cx from 'classnames';
import { Button } from "app/components/shadcn/Button";
// import controller from 'app/lib/controller';
// import { Toaster, TOASTER_SUCCESS } from 'app/lib/toaster/ToasterLib';
import { MdFormatListNumbered } from 'react-icons/md';

interface StartFromLineProps {
    disabled: boolean
}

const StartFromLine: React.FC<StartFromLineProps> = ({ disabled }) => {

    // TODO
    const handleStartFromLine = () => {
        console.log('start from line');
        // const { zMax } = this.props;
        // const { units } = this.state;
        // const { value, safeHeight } = this.state.startFromLine;

        // this.setState(prev => ({ startFromLine: { ...prev.startFromLine, showModal: false, needsRecovery: false } }));
        // const newSafeHeight = units === IMPERIAL_UNITS ? safeHeight * 25.4 : safeHeight;
        // controller.command('gcode:start', value, zMax, newSafeHeight);
        // reduxStore.dispatch({ type: UPDATE_JOB_OVERRIDES, payload: { isChecked: true, toggleStatus: 'overrides' } });
        // Toaster.pop({
        //     msg: 'Running Start From Specific Line Command',
        //     type: TOASTER_SUCCESS,
        //     duration: 2000,
        // });
    }

    return (
        <>
            {/* <Modal onClose={() => {
                this.setState(prev => ({ startFromLine: { ...prev.startFromLine, showModal: false, needsRecovery: false } }));
                actions.closeModal();
            }}
            >
                <Modal.Header className={styles.modalHeader}>
                    <Modal.Title>{needsRecovery ? 'Recovery: Start From Line' : 'Start From Line'}</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ backgroundColor: '#e5e7eb' }}>
                    <div className={styles.startFromLineContainer}>
                        <div className={styles.startDetails}>
                            <p className={styles.firstDetail}>
                                Recover a carve disrupted by power loss, disconnection,
                                mechanical malfunction, or other failures
                            </p>
                            <p style={{ marginBottom: '0px', color: '#000000' }}>Your job was last stopped around line: <b>{value}</b></p>
                            <p>on a g-code file with a total of <b>{lineTotal}</b> lines</p>
                            {
                                value > 0 &&
                                    <p>Recommended starting lines: <strong>{value - 10 >= 0 ? value - 10 : 0}</strong> - <strong>{value}</strong></p>
                            }
                        </div>
                        <div>
                            <Input
                                label="Resume job at line:"
                                value={value}
                                onChange={(e) => (e.target.value <= lineTotal && e.target.value >= 0) &&
                                    this.setState(prev => ({
                                        startFromLine: {
                                            ...prev.startFromLine,
                                            value: Math.ceil(Number(e.target.value))
                                        }
                                    }))
                                }
                                additionalProps={{ type: 'number', max: lineTotal, min: 0 }}
                            />
                        </div>
                        <div>
                            <Tooltip content={`Default Value: ${defaultSafeHeight}`}>
                                <Input
                                    label="With Safe Height:"
                                    value={safeHeight}
                                    onChange={(e) => {
                                        this.setState(prev => ({
                                            startFromLine: {
                                                ...prev.startFromLine,
                                                safeHeight: Number(e.target.value)
                                            }
                                        }));
                                    }}
                                    units={units}
                                    additionalProps={{ type: 'number' }}
                                />
                            </Tooltip>
                            <div className={cx(styles.startDetails, styles.small)} style={{ float: 'right', marginRight: '1rem' }}>
                                <p>
                                    (Safe Height is the value above Z max)
                                </p>
                            </div>
                        </div>
                        <div className={styles.startHeader}>
                            <p style={{ color: '#E2943B' }}>
                                Accounts for all past CNC movements, units, spindle speeds,
                                laser power, Start/Stop g-code, and any other file modals or setup.
                            </p>
                        </div>
                        <div className={styles.buttonsContainer}>
                            <button
                                type="button"
                                className={styles['workflow-button-play']}
                                title="Start from Line"
                                onClick={this.handleStartFromLine}
                                disabled={!isConnected}
                            >
                                Start from Line
                                <i className="fa fa-play" style={{ writingMode: 'horizontal-tb', marginLeft: '5px' }} />
                            </button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal> */}
            <Button
                disabled={disabled}
                className={cx(
                    "rounded-[0.2rem] border-solid border-2 text-base px-2",
                    {
                        "border-blue-400 bg-white [box-shadow:_2px_2px_5px_0px_var(--tw-shadow-color)] shadow-gray-400": !disabled,
                        "border-gray-500 bg-gray-400": disabled
                    }
                )}
                onClick={handleStartFromLine}
            >
                <MdFormatListNumbered className="text-2xl mr-1" /> Start From
            </Button>
        </>
    );
}

export default StartFromLine;