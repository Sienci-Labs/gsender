import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ZJog } from 'app/features/Jogging/components/ZJog';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('app/features/Jogging/utils/Jogging.ts', () => ({
    continuousJogAxis: jest.fn(),
    stopContinuousJog: jest.fn(),
    zPlusJog: jest.fn(),
    zMinusJog: jest.fn(),
}));

jest.mock('app/features/Jogging/assets/zLabels.svg', () => 'zLabels.svg', { virtual: true });

jest.mock('use-long-press', () => ({
    useLongPress: jest.fn((callback, options) => () => ({
        onMouseDown: jest.fn(),
        onMouseUp: () => options?.onCancel?.(),
        onTouchStart: jest.fn(),
        onTouchEnd: () => options?.onCancel?.(),
    })),
}));

jest.mock('app/features/Jogging/components/TabJog.tsx', () => ({
    __esModule: true,
    default: ({
        canClick,
        idForTest,
        topLabel,
        bottomLabel,
        onTopKeyDown,
        onBottomKeyDown,
        topHandlers,
        bottomHandlers,
    }: any) => (
        <div data-testid="tabjog">
            <button
                data-testid={`${idForTest}-plus`}
                aria-label={topLabel}
                disabled={!canClick}
                onKeyDown={onTopKeyDown}
                {...topHandlers}
            >
                Z+
            </button>
            <button
                data-testid={`${idForTest}-minus`}
                aria-label={bottomLabel}
                disabled={!canClick}
                onKeyDown={onBottomKeyDown}
                {...bottomHandlers}
            >
                Z-
            </button>
        </div>
    ),
}));

// ─── Default props ────────────────────────────────────────────────────────────

const defaultProps = {
    feedrate: 1000,
    distance: 5,
    canClick: true,
    threshold: 200,
};

const renderZJog = (props = {}) =>
    render(<ZJog {...defaultProps} {...props} />);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ZJog', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ── Rendering ─────────────────────────────────────────────────────────────

    describe('rendering', () => {
        it('renders without crashing', () => {
            renderZJog();
        });

        it('renders the outer container with id "zJog"', () => {
            renderZJog();
            expect(document.getElementById('zJog')).toBeInTheDocument();
        });

        it('renders TabJog component', () => {
            renderZJog();
            expect(screen.getByTestId('tabjog')).toBeInTheDocument();
        });

        it('renders Z+ button', () => {
            renderZJog();
            expect(screen.getByTestId('Z-plus')).toBeInTheDocument();
        });

        it('renders Z- button', () => {
            renderZJog();
            expect(screen.getByTestId('Z-minus')).toBeInTheDocument();
        });

        it('renders zLabels image', () => {
            renderZJog();
            expect(screen.getByAltText('Z Labels tab')).toBeInTheDocument();
        });

        it('renders image with correct src', () => {
            renderZJog();
            expect(screen.getByAltText('Z Labels tab')).toHaveAttribute('src', 'zLabels.svg');
        });

        it('renders image with pointer-events-none class', () => {
            renderZJog();
            expect(screen.getByAltText('Z Labels tab')).toHaveClass('pointer-events-none');
        });
    });

    // ── canClick prop ─────────────────────────────────────────────────────────

    describe('canClick prop', () => {
        it('enables Z+ button when canClick is true', () => {
            renderZJog({ canClick: true });
            expect(screen.getByTestId('Z-plus')).not.toBeDisabled();
        });

        it('enables Z- button when canClick is true', () => {
            renderZJog({ canClick: true });
            expect(screen.getByTestId('Z-minus')).not.toBeDisabled();
        });

        it('disables Z+ button when canClick is false', () => {
            renderZJog({ canClick: false });
            expect(screen.getByTestId('Z-plus')).toBeDisabled();
        });

        it('disables Z- button when canClick is false', () => {
            renderZJog({ canClick: false });
            expect(screen.getByTestId('Z-minus')).toBeDisabled();
        });
    });

    // ── Accessibility labels ──────────────────────────────────────────────────

    describe('accessibility', () => {
        it('Z+ button has aria-label "Jog Z plus"', () => {
            renderZJog();
            expect(screen.getByLabelText('Jog Z plus')).toBeInTheDocument();
        });

        it('Z- button has aria-label "Jog Z minus"', () => {
            renderZJog();
            expect(screen.getByLabelText('Jog Z minus')).toBeInTheDocument();
        });
    });

    // ── Keyboard interaction ──────────────────────────────────────────────────

    describe('keyboard interaction', () => {
        it('calls zPlusJog when Enter is pressed on Z+ button', () => {
            const { zPlusJog } = require('app/features/Jogging/utils/Jogging.ts');
            renderZJog();
            fireEvent.keyDown(screen.getByTestId('Z-plus'), { key: 'Enter' });
            expect(zPlusJog).toHaveBeenCalledWith(defaultProps.distance, defaultProps.feedrate, false);
        });

        it('calls zPlusJog when Space is pressed on Z+ button', () => {
            const { zPlusJog } = require('app/features/Jogging/utils/Jogging.ts');
            renderZJog();
            fireEvent.keyDown(screen.getByTestId('Z-plus'), { key: ' ' });
            expect(zPlusJog).toHaveBeenCalledWith(defaultProps.distance, defaultProps.feedrate, false);
        });

        it('calls zMinusJog when Enter is pressed on Z- button', () => {
            const { zMinusJog } = require('app/features/Jogging/utils/Jogging.ts');
            renderZJog();
            fireEvent.keyDown(screen.getByTestId('Z-minus'), { key: 'Enter' });
            expect(zMinusJog).toHaveBeenCalledWith(defaultProps.distance, defaultProps.feedrate, false);
        });

        it('calls zMinusJog when Space is pressed on Z- button', () => {
            const { zMinusJog } = require('app/features/Jogging/utils/Jogging.ts');
            renderZJog();
            fireEvent.keyDown(screen.getByTestId('Z-minus'), { key: ' ' });
            expect(zMinusJog).toHaveBeenCalledWith(defaultProps.distance, defaultProps.feedrate, false);
        });

        it('does NOT call zPlusJog for other keys on Z+ button', () => {
            const { zPlusJog } = require('app/features/Jogging/utils/Jogging.ts');
            renderZJog();
            fireEvent.keyDown(screen.getByTestId('Z-plus'), { key: 'Tab' });
            fireEvent.keyDown(screen.getByTestId('Z-plus'), { key: 'Escape' });
            expect(zPlusJog).not.toHaveBeenCalled();
        });

        it('does NOT call zMinusJog for other keys on Z- button', () => {
            const { zMinusJog } = require('app/features/Jogging/utils/Jogging.ts');
            renderZJog();
            fireEvent.keyDown(screen.getByTestId('Z-minus'), { key: 'Tab' });
            fireEvent.keyDown(screen.getByTestId('Z-minus'), { key: 'Escape' });
            expect(zMinusJog).not.toHaveBeenCalled();
        });

        it('prevents default on Enter key for Z+ button', () => {
            renderZJog();
            const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
            const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
            screen.getByTestId('Z-plus').dispatchEvent(event);
            expect(preventDefaultSpy).toHaveBeenCalled();
        });

        it('prevents default on Space key for Z- button', () => {
            renderZJog();
            const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
            const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
            screen.getByTestId('Z-minus').dispatchEvent(event);
            expect(preventDefaultSpy).toHaveBeenCalled();
        });
    });

    // ── Long press (useLongPress) ─────────────────────────────────────────────

    describe('long press behaviour', () => {
        it('calls zPlusJog on short press (onCancel) of Z+ button', () => {
            const { zPlusJog } = require('app/features/Jogging/utils/Jogging.ts');
            renderZJog();
            fireEvent.mouseUp(screen.getByTestId('Z-plus'));
            expect(zPlusJog).toHaveBeenCalled();
        });

        it('calls zMinusJog on short press (onCancel) of Z- button', () => {
            const { zMinusJog } = require('app/features/Jogging/utils/Jogging.ts');
            renderZJog();
            fireEvent.mouseUp(screen.getByTestId('Z-minus'));
            expect(zMinusJog).toHaveBeenCalled();
        });

        it('passes correct threshold to useLongPress', () => {
            const { useLongPress } = require('use-long-press');
            renderZJog({ threshold: 300 });
            expect(useLongPress).toHaveBeenCalledWith(
                expect.any(Function),
                expect.objectContaining({ threshold: 300 }),
            );
        });

        it('uses default threshold of 200 when not provided', () => {
            const { useLongPress } = require('use-long-press');
            render(<ZJog feedrate={1000} distance={5} canClick={true} />);
            expect(useLongPress).toHaveBeenCalledWith(
                expect.any(Function),
                expect.objectContaining({ threshold: 200 }),
            );
        });
    });

    // ── Props passed correctly ────────────────────────────────────────────────

    describe('props', () => {
        it('passes correct distance to zPlusJog on keydown', () => {
            const { zPlusJog } = require('app/features/Jogging/utils/Jogging.ts');
            renderZJog({ distance: 10, feedrate: 500 });
            fireEvent.keyDown(screen.getByTestId('Z-plus'), { key: 'Enter' });
            expect(zPlusJog).toHaveBeenCalledWith(10, 500, false);
        });

        it('passes correct distance to zMinusJog on keydown', () => {
            const { zMinusJog } = require('app/features/Jogging/utils/Jogging.ts');
            renderZJog({ distance: 2, feedrate: 750 });
            fireEvent.keyDown(screen.getByTestId('Z-minus'), { key: 'Enter' });
            expect(zMinusJog).toHaveBeenCalledWith(2, 750, false);
        });
    });
    //------------------------------------//
    // ── Container classes--------------//
    //-----------------------------------//

    describe('container styling', () => {
        it('outer div has relative positioning class', () => {
            renderZJog();
            expect(document.getElementById('zJog')).toHaveClass('relative');
        });

        it('outer div has correct width class', () => {
            renderZJog();
            expect(document.getElementById('zJog')).toHaveClass('w-[45px]');
        });

        it('outer div has correct height class', () => {
            renderZJog();
            expect(document.getElementById('zJog')).toHaveClass('h-[168px]');
        });
    });
});
