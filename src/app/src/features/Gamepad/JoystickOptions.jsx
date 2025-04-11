import React, { useContext } from 'react';
import Select from 'react-select';
import { cloneDeep, set, get } from 'lodash';

import Switch from 'app/components/Switch';

import { Input } from 'app/components/Input';
import { GamepadContext } from './utils/context';
import { arrayComparator } from './utils';
import { setGamepadProfileList } from './utils/actions';
import { useGamepadListener } from 'app/lib/hooks/useGamepadListener';

const JoystickOptions = () => {
    const {
        state: {
            currentProfile,
            settings: { profiles },
        },
        actions: { getGamepadProfile },
        dispatch,
    } = useContext(GamepadContext);

    const { axes, buttons } = useGamepadListener({
        profile: currentProfile,
        axisThreshold: 0.4,
    });

    const handleChange = (key, value) => {
        const updatedProfiles = profiles.map((profile) => {
            const isCurrentProfile = arrayComparator(
                profile.id,
                currentProfile,
            );

            if (isCurrentProfile) {
                const updatedProfileItem = cloneDeep(profile);

                set(updatedProfileItem, `joystickOptions.${key}`, value);

                return updatedProfileItem;
            }

            return profile;
        });

        dispatch(setGamepadProfileList(updatedProfiles));
    };

    const axesOptions = [
        { label: 'None', value: null },
        { label: 'X', value: 'x' },
        { label: 'Y', value: 'y' },
        { label: 'Z', value: 'z' },
        { label: 'A', value: 'a' },
    ];

    const profile = getGamepadProfile(currentProfile);

    const {
        joystickOptions: {
            stick1,
            stick2,
            zeroThreshold = 15,
            movementDistanceOverride = 100,
        },
    } = profile;

    const stick1PrimaryActionIsUsingMPG =
        get(stick1, 'mpgMode.primaryAction', null) !== null;
    const stick1SecondaryActionIsUsingMPG =
        get(stick1, 'mpgMode.secondaryAction', null) !== null;

    const stick2PrimaryActionIsUsingMPG =
        get(stick2, 'mpgMode.primaryAction', null) !== null;
    const stick2SecondaryActionIsUsingMPG =
        get(stick2, 'mpgMode.secondaryAction', null) !== null;

    const isHoldingModifierButton = buttons[profile.modifier?.button]?.pressed;

    const selectOverrideStyle = {
        valueContainer: (provided) => ({
            ...provided,
            padding: 2,
            justifyContent: 'center',
        }),
        dropdownIndicator: (provided) => ({ ...provided, padding: 2 }),
        container: (provided) => ({ ...provided, padding: 0 }),
    };

    const activeStyle = {
        control: (provided) => ({
            ...provided,
            backgroundColor: 'rgb(75, 181, 67)',
            borderColor: 'rgb(75, 181, 67)',
        }),
        singleValue: (provided) => ({ ...provided, color: 'white' }),
        dropdownIndicator: (provided) => ({
            ...provided,
            padding: 2,
            color: 'white',
        }),
        indicatorSeparator: (provided) => ({
            ...provided,
            backgroundColor: 'white',
        }),
    };

    return (
        <div className="text-base">
            <div className="grid grid-cols-4 items-center gap-2">
                <div />
                <div className="dark:text-white">Action</div>
                <div className="dark:text-white">2nd Action</div>
                <div className="dark:text-white">Invert</div>
            </div>

            <div className="grid grid-cols-4 items-center mb-2 gap-2">
                <div className="dark:text-white">Stick 1 Left/Right</div>
                <Select
                    styles={
                        !stick1PrimaryActionIsUsingMPG &&
                        axes &&
                        axes[0] !== 0 &&
                        !isHoldingModifierButton
                            ? { ...selectOverrideStyle, ...activeStyle }
                            : selectOverrideStyle
                    }
                    options={axesOptions}
                    placeholder={null}
                    value={{
                        label: get(stick1, 'horizontal.primaryAction', null)
                            ? String(
                                  get(stick1, 'horizontal.primaryAction'),
                              ).toUpperCase()
                            : 'None',
                        value: get(stick1, 'horizontal.primaryAction', null),
                    }}
                    onChange={({ value }) =>
                        handleChange('stick1.horizontal.primaryAction', value)
                    }
                    isDisabled={stick1PrimaryActionIsUsingMPG}
                />
                <Select
                    styles={
                        !stick1SecondaryActionIsUsingMPG &&
                        axes &&
                        axes[0] !== 0 &&
                        isHoldingModifierButton
                            ? { ...selectOverrideStyle, ...activeStyle }
                            : selectOverrideStyle
                    }
                    options={axesOptions}
                    placeholder={null}
                    value={{
                        label: get(stick1, 'horizontal.secondaryAction', null)
                            ? String(
                                  get(stick1, 'horizontal.secondaryAction'),
                              ).toUpperCase()
                            : 'None',
                        value: get(stick1, 'horizontal.secondaryAction', null),
                    }}
                    onChange={({ value }) =>
                        handleChange('stick1.horizontal.secondaryAction', value)
                    }
                    isDisabled={stick1SecondaryActionIsUsingMPG}
                />
                <Switch
                    checked={stick1.horizontal.isReversed}
                    onChange={(checked) =>
                        handleChange('stick1.horizontal.isReversed', checked)
                    }
                    disabled={
                        stick1PrimaryActionIsUsingMPG &&
                        stick1SecondaryActionIsUsingMPG
                    }
                />
            </div>

            <div className="grid grid-cols-4 items-center mb-2 gap-2">
                <div className="dark:text-white">Stick 1 Up/Down</div>
                <Select
                    styles={
                        !stick1PrimaryActionIsUsingMPG &&
                        axes &&
                        axes[1] !== 0 &&
                        !isHoldingModifierButton
                            ? { ...selectOverrideStyle, ...activeStyle }
                            : selectOverrideStyle
                    }
                    options={axesOptions}
                    placeholder={null}
                    value={{
                        label: get(stick1, 'vertical.primaryAction', null)
                            ? String(
                                  get(stick1, 'vertical.primaryAction'),
                              ).toUpperCase()
                            : 'None',
                        value: get(stick1, 'vertical.primaryAction', null),
                    }}
                    onChange={({ value }) =>
                        handleChange('stick1.vertical.primaryAction', value)
                    }
                    isDisabled={stick1PrimaryActionIsUsingMPG}
                />
                <Select
                    styles={
                        !stick1SecondaryActionIsUsingMPG &&
                        axes &&
                        axes[1] !== 0 &&
                        isHoldingModifierButton
                            ? { ...selectOverrideStyle, ...activeStyle }
                            : selectOverrideStyle
                    }
                    options={axesOptions}
                    placeholder={null}
                    value={{
                        label: get(stick1, 'vertical.secondaryAction', null)
                            ? String(
                                  get(stick1, 'vertical.secondaryAction'),
                              ).toUpperCase()
                            : 'None',
                        value: get(stick1, 'vertical.secondaryAction', null),
                    }}
                    onChange={({ value }) =>
                        handleChange('stick1.vertical.secondaryAction', value)
                    }
                    isDisabled={stick1SecondaryActionIsUsingMPG}
                />
                <Switch
                    checked={stick1.vertical.isReversed}
                    onChange={(checked) =>
                        handleChange('stick1.vertical.isReversed', checked)
                    }
                    disabled={
                        stick1PrimaryActionIsUsingMPG &&
                        stick1SecondaryActionIsUsingMPG
                    }
                />
            </div>

            <div className="grid grid-cols-4 items-center mb-2 gap-2">
                <div className="dark:text-white">Stick 1 Use MPG</div>
                <Select
                    styles={
                        stick1PrimaryActionIsUsingMPG &&
                        axes &&
                        (axes[0] !== 0 || axes[1] !== 0) &&
                        !isHoldingModifierButton
                            ? { ...selectOverrideStyle, ...activeStyle }
                            : selectOverrideStyle
                    }
                    options={axesOptions}
                    placeholder={null}
                    value={{
                        label: get(stick1, 'mpgMode.primaryAction', null)
                            ? String(
                                  get(stick1, 'mpgMode.primaryAction'),
                              ).toUpperCase()
                            : 'None',
                        value: get(stick1, 'mpgMode.primaryAction', null),
                    }}
                    onChange={({ value }) =>
                        handleChange('stick1.mpgMode.primaryAction', value)
                    }
                />
                <Select
                    styles={
                        stick1SecondaryActionIsUsingMPG &&
                        axes &&
                        (axes[0] !== 0 || axes[1] !== 0) &&
                        isHoldingModifierButton
                            ? { ...selectOverrideStyle, ...activeStyle }
                            : selectOverrideStyle
                    }
                    options={axesOptions}
                    placeholder={null}
                    value={{
                        label: get(stick1, 'mpgMode.secondaryAction', null)
                            ? String(
                                  get(stick1, 'mpgMode.secondaryAction'),
                              ).toUpperCase()
                            : 'None',
                        value: get(stick1, 'mpgMode.secondaryAction', null),
                    }}
                    onChange={({ value }) =>
                        handleChange('stick1.mpgMode.secondaryAction', value)
                    }
                />
                <Switch
                    checked={stick1.mpgMode.isReversed}
                    onChange={(checked) =>
                        handleChange('stick1.mpgMode.isReversed', checked)
                    }
                />
            </div>

            <div className="grid grid-cols-4 items-center mb-2 gap-2">
                <div className="dark:text-white">Stick 2 Left/Right</div>
                <Select
                    styles={
                        !stick2PrimaryActionIsUsingMPG &&
                        axes &&
                        axes[2] !== 0 &&
                        !isHoldingModifierButton
                            ? { ...selectOverrideStyle, ...activeStyle }
                            : selectOverrideStyle
                    }
                    options={axesOptions}
                    placeholder={null}
                    value={{
                        label: get(stick2, 'horizontal.primaryAction', null)
                            ? String(
                                  get(stick2, 'horizontal.primaryAction'),
                              ).toUpperCase()
                            : 'None',
                        value: get(stick2, 'horizontal.primaryAction'),
                    }}
                    onChange={({ value }) =>
                        handleChange('stick2.horizontal.primaryAction', value)
                    }
                    isDisabled={stick2PrimaryActionIsUsingMPG}
                />
                <Select
                    styles={
                        !stick2SecondaryActionIsUsingMPG &&
                        axes &&
                        axes[2] !== 0 &&
                        isHoldingModifierButton
                            ? { ...selectOverrideStyle, ...activeStyle }
                            : selectOverrideStyle
                    }
                    options={axesOptions}
                    placeholder={null}
                    value={{
                        label: get(stick2, 'horizontal.secondaryAction', null)
                            ? String(
                                  get(stick2, 'horizontal.secondaryAction'),
                              ).toUpperCase()
                            : 'None',
                        value: get(stick2, 'horizontal.secondaryAction'),
                    }}
                    onChange={({ value }) =>
                        handleChange('stick2.horizontal.secondaryAction', value)
                    }
                    isDisabled={stick2SecondaryActionIsUsingMPG}
                />
                <Switch
                    checked={stick2.horizontal.isReversed}
                    onChange={(checked) =>
                        handleChange('stick2.horizontal.isReversed', checked)
                    }
                    disabled={
                        stick2PrimaryActionIsUsingMPG &&
                        stick2SecondaryActionIsUsingMPG
                    }
                />
            </div>

            <div className="grid grid-cols-4 items-center mb-2 gap-2">
                <div className="dark:text-white">Stick 2 Up/Down</div>
                <Select
                    styles={
                        !stick2PrimaryActionIsUsingMPG &&
                        axes &&
                        axes[3] !== 0 &&
                        !isHoldingModifierButton
                            ? { ...selectOverrideStyle, ...activeStyle }
                            : selectOverrideStyle
                    }
                    options={axesOptions}
                    placeholder={null}
                    value={{
                        label: get(stick2, 'vertical.primaryAction', null)
                            ? String(
                                  get(stick2, 'vertical.primaryAction'),
                              ).toUpperCase()
                            : 'None',
                        value: get(stick2, 'vertical.primaryAction'),
                    }}
                    onChange={({ value }) =>
                        handleChange('stick2.vertical.primaryAction', value)
                    }
                    isDisabled={stick2PrimaryActionIsUsingMPG}
                />
                <Select
                    styles={
                        !stick2SecondaryActionIsUsingMPG &&
                        axes &&
                        axes[3] !== 0 &&
                        isHoldingModifierButton
                            ? { ...selectOverrideStyle, ...activeStyle }
                            : selectOverrideStyle
                    }
                    options={axesOptions}
                    placeholder={null}
                    value={{
                        label: get(stick2, 'vertical.secondaryAction', null)
                            ? String(
                                  get(stick2, 'vertical.secondaryAction'),
                              ).toUpperCase()
                            : 'None',
                        value: get(stick2, 'vertical.secondaryAction'),
                    }}
                    onChange={({ value }) =>
                        handleChange('stick2.vertical.secondaryAction', value)
                    }
                    isDisabled={stick2SecondaryActionIsUsingMPG}
                />
                <Switch
                    checked={stick2.vertical.isReversed}
                    onChange={(checked) =>
                        handleChange('stick2.vertical.isReversed', checked)
                    }
                    disabled={
                        stick2PrimaryActionIsUsingMPG &&
                        stick2SecondaryActionIsUsingMPG
                    }
                />
            </div>

            <div className="grid grid-cols-4 items-center mb-2 gap-2">
                <div className="dark:text-white">Stick 2 Use MPG</div>
                <Select
                    styles={
                        stick2PrimaryActionIsUsingMPG &&
                        axes &&
                        (axes[2] !== 0 || axes[3] !== 0) &&
                        !isHoldingModifierButton
                            ? { ...selectOverrideStyle, ...activeStyle }
                            : selectOverrideStyle
                    }
                    menuPlacement="top"
                    options={axesOptions}
                    placeholder={null}
                    value={{
                        label: get(stick2, 'mpgMode.primaryAction', null)
                            ? String(
                                  get(stick2, 'mpgMode.primaryAction'),
                              ).toUpperCase()
                            : 'None',
                        value: get(stick2, 'mpgMode.primaryAction'),
                    }}
                    onChange={({ value }) =>
                        handleChange('stick2.mpgMode.primaryAction', value)
                    }
                />
                <Select
                    styles={
                        stick2SecondaryActionIsUsingMPG &&
                        axes &&
                        (axes[2] !== 0 || axes[3] !== 0) &&
                        isHoldingModifierButton
                            ? { ...selectOverrideStyle, ...activeStyle }
                            : selectOverrideStyle
                    }
                    menuPlacement="top"
                    options={axesOptions}
                    placeholder={null}
                    value={{
                        label: get(stick2, 'mpgMode.secondaryAction', null)
                            ? String(
                                  get(stick2, 'mpgMode.secondaryAction'),
                              ).toUpperCase()
                            : 'None',
                        value: get(stick2, 'mpgMode.secondaryAction'),
                    }}
                    onChange={({ value }) =>
                        handleChange('stick2.mpgMode.secondaryAction', value)
                    }
                />
                <Switch
                    checked={stick2.mpgMode.isReversed}
                    onChange={(checked) =>
                        handleChange('stick2.mpgMode.isReversed', checked)
                    }
                />
            </div>

            <div className="grid grid-cols-4 items-center mb-2 gap-2">
                <div className="dark:text-white">Zero Threshold</div>
                <Input
                    value={zeroThreshold}
                    type="number"
                    min={0}
                    max={99}
                    step={5}
                    onChange={(e) =>
                        handleChange('zeroThreshold', Number(e.target.value))
                    }
                    className="p-1 w-full"
                    suffix="%"
                />
            </div>

            <div className="grid grid-cols-4 items-center mb-2 gap-2">
                <div className="dark:text-white">
                    Movement Distance Override
                </div>
                <Input
                    type="number"
                    value={movementDistanceOverride}
                    min={10}
                    max={99999}
                    step={1}
                    onChange={(e) =>
                        handleChange(
                            'movementDistanceOverride',
                            Number(e.target.value),
                        )
                    }
                    className="p-1 w-full"
                    suffix="%"
                />
            </div>
        </div>
    );
};

export default JoystickOptions;
