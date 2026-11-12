/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

import { ActiveStateButton } from 'app/components/ActiveStateButton';
import { Input } from 'app/components/shadcn/Input';
import { Slider } from 'app/components/shadcn/Slider';
import Tooltip from 'app/components/Tooltip';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { useAppTranslation } from 'app/i18n';
import store from 'app/store';
import { useEffect, useState } from 'react';
import { FaBan, FaRedoAlt, FaUndoAlt } from 'react-icons/fa';
import type { SendM5Type } from '../definitions';

type Props = {
    actions: {
        sendM3: () => void;
        sendM4: () => void;
        sendM5: (sendM5Type: SendM5Type) => void;
        handleSpindleSpeedChange: (value: number) => void;
    };
    state: {
        spindleSpeed: number;
        spindleMin: number;
        spindleMax: number;
    };
    canClick: boolean;
    isConnected: boolean;
};

const SpindleControls = ({ actions, state, canClick, isConnected }: Props) => {
    const { t } = useAppTranslation();
    const { spindle } = useTypedSelector((state) => state.controller.modal);
    const [inputType, setInputType] = useState(
        store.get('widgets.spindle.inputType', 'Slider'),
    );
    const [localSpeed, setLocalSpeed] = useState(state.spindleSpeed);

    useEffect(() => {
        setLocalSpeed(state.spindleSpeed);
    }, [state.spindleSpeed]);

    useEffect(() => {
        const handleChange = () => {
            const currentInputType = store.get(
                'widgets.spindle.inputType',
                'Slider',
            );
            if (currentInputType !== inputType) {
                setInputType(currentInputType);
            }
        };

        store.on('change', handleChange);
        return () => {
            store.removeListener('change', handleChange);
        };
    }, [inputType]);

    const spindleForward = spindle === 'M3';
    const spindleReverse = spindle === 'M4';

    const handleInputBlur = () => {
        let val = Number(localSpeed);
        if (isNaN(val)) val = state.spindleMin;
        val = Math.max(state.spindleMin, Math.min(state.spindleMax, val));
        actions.handleSpindleSpeedChange(val);
        setLocalSpeed(val);
    };

    const handleInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleInputBlur();
        }
    };

    return (
        <>
            <div className="flex flex-row gap-2 justify-center">
                <ActiveStateButton
                    onClick={actions.sendM3}
                    disabled={!canClick}
                    icon={<FaRedoAlt />}
                    text={t('workspace:spindle.controls.forward')}
                    size="sm"
                    className="w-full"
                    active={isConnected && spindleForward}
                    tooltip={{
                        content: t('workspace:spindle.controls.forwardTooltip'),
                    }}
                    aria-label={t(
                        'workspace:spindle.controls.forwardAriaLabel',
                    )}
                />
                <ActiveStateButton
                    onClick={actions.sendM4}
                    disabled={!canClick}
                    icon={<FaUndoAlt />}
                    text={t('workspace:spindle.controls.reverse')}
                    size="sm"
                    className="w-full"
                    active={spindleReverse}
                    tooltip={{
                        content: t('workspace:spindle.controls.reverseTooltip'),
                    }}
                    aria-label={t(
                        'workspace:spindle.controls.reverseAriaLabel',
                    )}
                />
                <ActiveStateButton
                    onClick={() => actions.sendM5({ type: 'spindle' })}
                    disabled={!canClick}
                    icon={<FaBan />}
                    text={t('workspace:spindle.controls.stop')}
                    size="sm"
                    className="w-full"
                    tooltip={{
                        content: t('workspace:spindle.controls.stopTooltip'),
                    }}
                    aria-label={t('workspace:spindle.controls.stopAriaLabel')}
                />
            </div>
            <div className="grid grid-cols-[1fr_3fr_1fr] gap-2 justify-center items-center dark:text-content-primary">
                <span className="text-right">
                    {t('workspace:spindle.controls.speed')}
                </span>
                {inputType === 'Slider' ? (
                    <Tooltip
                        content={t('workspace:spindle.controls.adjustSpeed')}
                        side="bottom"
                    >
                        <Slider
                            value={[state.spindleSpeed]}
                            min={state.spindleMin}
                            max={state.spindleMax}
                            step={10}
                            className="h-8 w-full"
                            onValueChange={(value: number[]) =>
                                actions.handleSpindleSpeedChange(value[0])
                            }
                            disabled={!canClick}
                            aria-label={t(
                                'workspace:spindle.controls.adjustSpeed',
                            )}
                        />
                    </Tooltip>
                ) : (
                    <div className="w-full flex justify-center">
                        <Input
                            type="number"
                            value={localSpeed}
                            onChange={(e) =>
                                setLocalSpeed(Number(e.target.value))
                            }
                            onBlur={handleInputBlur}
                            onKeyDown={handleInputKeyDown}
                            min={state.spindleMin}
                            max={state.spindleMax}
                            disabled={!canClick}
                            className="h-8 w-full"
                            aria-label={t(
                                'workspace:spindle.controls.typeSpeed',
                            )}
                        />
                    </div>
                )}
                <div className={'w-[10ch] text-left flex flex-row'}>
                    {inputType === 'Slider' ? (
                        <>{state.spindleSpeed} RPM</>
                    ) : (
                        <>RPM</>
                    )}
                </div>
            </div>
        </>
    );
};

export default SpindleControls;
