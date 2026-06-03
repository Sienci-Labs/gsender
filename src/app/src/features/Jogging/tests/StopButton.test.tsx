import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StopButton } from 'app/features/Jogging/components/StopButton';

describe('StopButton', () => {
    //-----------------------------------------------//
    // ---Rendering ---------------------------------//
    //---------------------------------------------//

    describe('rendering', () => {
        it('renders without crashing', () => {
            render(<StopButton onClick={jest.fn()} />);
        });

        it('renders an SVG element', () => {
            render(<StopButton onClick={jest.fn()} />);
            expect(document.querySelector('svg')).toBeInTheDocument();
        });

        it('has role="button"', () => {
            render(<StopButton onClick={jest.fn()} />);
            expect(screen.getByRole('button')).toBeInTheDocument();
        });

        it('has aria-label "Stop Jogging"', () => {
            render(<StopButton onClick={jest.fn()} />);
            expect(screen.getByLabelText('Stop Jogging')).toBeInTheDocument();
        });
    });
    //---------------------------------------------//
    // ------Default props-------------------------//
    //---------------------------------------------//
    describe('default props', () => {
        it('is not disabled by default', () => {
            render(<StopButton onClick={jest.fn()} />);
            const btn = screen.getByRole('button');
            expect(btn.tabIndex).toBe(0);
        });

        it('has cursor-pointer class when not disabled', () => {
            render(<StopButton onClick={jest.fn()} />);
            const btn = screen.getByRole('button');
            expect(btn).toHaveClass('cursor-pointer');
        });

        it('does not have cursor-not-allowed class when not disabled', () => {
            render(<StopButton onClick={jest.fn()} />);
            const btn = screen.getByRole('button');
            expect(btn).not.toHaveClass('cursor-not-allowed');
        });
    });
    //----------------------------------------------------------//
    // ----------------Disabled state -------------------------//
    //---------------------------------------------------------//

    describe('disabled state', () => {
        it('sets tabIndex to -1 when disabled', () => {
            render(<StopButton disabled onClick={jest.fn()} />);
            const btn = screen.getByRole('button');
            expect(btn.tabIndex).toBe(-1);
        });

        it('has cursor-not-allowed class when disabled', () => {
            render(<StopButton disabled onClick={jest.fn()} />);
            const btn = screen.getByRole('button');
            expect(btn).toHaveClass('cursor-not-allowed');
        });

        it('does not have cursor-pointer class when disabled', () => {
            render(<StopButton disabled onClick={jest.fn()} />);
            const btn = screen.getByRole('button');
            expect(btn).not.toHaveClass('cursor-pointer');
        });

        it('path has fill-gray-500 class when disabled', () => {
            render(<StopButton disabled onClick={jest.fn()} />);
            const path = document.querySelector('svg path');
            expect(path).toHaveClass('fill-gray-500');
        });

        it('path does not have hover:fill-red-600 class when disabled', () => {
            render(<StopButton disabled onClick={jest.fn()} />);
            const path = document.querySelector('svg path');
            expect(path).not.toHaveClass('hover:fill-red-600');
        });
    });
    //---------------------------------------------------------//
    // ------Enabled state (path classes) ---------------------//
    //---------------------------------------------------------//

    describe('enabled state', () => {
        it('path has hover:fill-red-600 class when enabled', () => {
            render(<StopButton onClick={jest.fn()} />);
            const path = document.querySelector('svg path');
            expect(path).toHaveClass('hover:fill-red-600');
        });

        it('path has active:fill-red-700 class when enabled', () => {
            render(<StopButton onClick={jest.fn()} />);
            const path = document.querySelector('svg path');
            expect(path).toHaveClass('active:fill-red-700');
        });

        it('path does not have fill-gray-500 class when enabled', () => {
            render(<StopButton onClick={jest.fn()} />);
            const path = document.querySelector('svg path');
            expect(path).not.toHaveClass('fill-gray-500');
        });
    });
    //-----------------------------------------//
    // --------------onClick------------------//
    //---------------------------------------//
    describe('onClick', () => {
        it('calls onClick when SVG is clicked', () => {
            const onClick = jest.fn();
            render(<StopButton onClick={onClick} />);
            fireEvent.click(screen.getByRole('button'));
            expect(onClick).toHaveBeenCalledTimes(1);
        });

        it('calls onClick when inner path is clicked', () => {
            const onClick = jest.fn();
            render(<StopButton onClick={onClick} />);
            const paths = document.querySelectorAll('svg path');
            fireEvent.click(paths[1]); // second path has onClick, event also bubbles to SVG
            expect(onClick).toHaveBeenCalledTimes(2);
        });

        it('does not throw when clicked without disabled prop', () => {
            const onClick = jest.fn();
            render(<StopButton onClick={onClick} />);
            expect(() => fireEvent.click(screen.getByRole('button'))).not.toThrow();
        });
    });
    //-------------------------------------------------------//
    //--------------------Keyboard events--------------------// 
    //-------------------------------------------------------//
    describe('keyboard interaction', () => {
        it('calls onClick when Enter key is pressed', () => {
            const onClick = jest.fn();
            render(<StopButton onClick={onClick} />);
            fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
            expect(onClick).toHaveBeenCalledTimes(1);
        });

        it('calls onClick when Space key is pressed', () => {
            const onClick = jest.fn();
            render(<StopButton onClick={onClick} />);
            fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
            expect(onClick).toHaveBeenCalledTimes(1);
        });

        it('does NOT call onClick for other keys', () => {
            const onClick = jest.fn();
            render(<StopButton onClick={onClick} />);
            fireEvent.keyDown(screen.getByRole('button'), { key: 'Tab' });
            fireEvent.keyDown(screen.getByRole('button'), { key: 'Escape' });
            fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowUp' });
            expect(onClick).not.toHaveBeenCalled();
        });

        it('prevents default on Enter keydown', () => {
            const onClick = jest.fn();
            render(<StopButton onClick={onClick} />);
            const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
            const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
            screen.getByRole('button').dispatchEvent(event);
            expect(preventDefaultSpy).toHaveBeenCalled();
        });

        it('prevents default on Space keydown', () => {
            const onClick = jest.fn();
            render(<StopButton onClick={onClick} />);
            const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
            const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
            screen.getByRole('button').dispatchEvent(event);
            expect(preventDefaultSpy).toHaveBeenCalled();
        });
    });
    //----------------------------------//
    // ── SVG attributes ---------------//
    //----------------------------------//
    describe('SVG attributes', () => {
        it('has correct viewBox', () => {
            render(<StopButton onClick={jest.fn()} />);
            expect(document.querySelector('svg')).toHaveAttribute('viewBox', '0 0 79 79');
        });

        it('has correct xmlns', () => {
            render(<StopButton onClick={jest.fn()} />);
            expect(document.querySelector('svg')).toHaveAttribute(
                'xmlns',
                'http://www.w3.org/2000/svg',
            );
        });

        it('has positioning classes for centering', () => {
            render(<StopButton onClick={jest.fn()} />);
            const svg = document.querySelector('svg');
            expect(svg).toHaveClass('absolute');
            expect(svg).toHaveClass('-translate-x-1/2');
            expect(svg).toHaveClass('-translate-y-1/2');
        });
    });

});
