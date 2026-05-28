import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GcodeViewer } from '../components/GcodeViewer';
import Input from '../components/Input';
import SpiralIcon from '../SVG/Spiral';
import ZigZagIcon from '../SVG/ZigZag';

// ────────────────────────────────────────────────────
// GcodeViewer
// ────────────────────────────────────────────────────
describe('GcodeViewer Component', () => {
    const sampleGcode = 'G21 ;mm\nG90\nG0 X0 Y0\nM5';

    it('should render without crashing', () => {                                                          
        render(<GcodeViewer gcode={sampleGcode} />);
        expect(screen.getByText('G-code Output')).toBeInTheDocument();
    });

    it('should render all gcode lines', () => {                       
        render(<GcodeViewer gcode={sampleGcode} />);
        expect(screen.getByText('G21 ;mm')).toBeInTheDocument();
        expect(screen.getByText('G90')).toBeInTheDocument();
        expect(screen.getByText('G0 X0 Y0')).toBeInTheDocument();
        expect(screen.getByText('M5')).toBeInTheDocument();
    });

    it('should render line numbers', () => {                                 
        render(<GcodeViewer gcode={sampleGcode} />);
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('should render Copy G-code button', () => {                          
        render(<GcodeViewer gcode={sampleGcode} />);
        expect(screen.getByText('Copy G-code')).toBeInTheDocument();
    });

    it('should render with empty gcode without crashing', () => {                    
        render(<GcodeViewer gcode="" />);
        expect(screen.getByText('G-code Output')).toBeInTheDocument();
    });

    it('should render single line gcode', () => {                                               
        render(<GcodeViewer gcode="G21" />);
        expect(screen.getByText('G21')).toBeInTheDocument();
    });

    it('should copy gcode to clipboard on button click', async () => {                            
        Object.assign(navigator, {
            clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
        });
        render(<GcodeViewer gcode={sampleGcode} />);
        fireEvent.click(screen.getByText('Copy G-code'));
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(sampleGcode);
    });

    it('should alternate row background colors', () => {                  
        render(<GcodeViewer gcode={sampleGcode} />);
        const pre = document.querySelector('pre');
        expect(pre).toBeInTheDocument();
        const rows = pre!.querySelectorAll('div');
        expect(rows.length).toBe(4);
    });

    it('should render multiline gcode correctly', () => {                      
        const multiline = 'G21\nG90\nG0 X0\nG0 Y0\nM5';
        render(<GcodeViewer gcode={multiline} />);
        expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should handle clipboard error gracefully', async () => {                
        Object.assign(navigator, {
            clipboard: { writeText: jest.fn().mockRejectedValue(new Error('Failed')) },
        });
        render(<GcodeViewer gcode="G21" />);
        fireEvent.click(screen.getByText('Copy G-code'));
        await new Promise(resolve => setTimeout(resolve, 100));
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });

});

// ─────────────────────────────────────────────
// Input Component
// ─────────────────────────────────────────────
describe('Input Component', () => {
    it('should render without crashing', () => {
        render(<Input />);
        expect(document.querySelector('input')).toBeInTheDocument();                                 
    });

    it('should render with label', () => {
        render(<Input label="Width" />);
        expect(screen.getByText('Width')).toBeInTheDocument();                                      
    });

    it('should not render label element when label prop is absent', () => {
        render(<Input />);
        expect(screen.queryByRole('label')).not.toBeInTheDocument();                                
    });

    it('should render with suffix', () => {
        render(<Input suffix={<span>mm</span>} />);
        expect(screen.getByText('mm')).toBeInTheDocument();                                              
    });

    it('should render with placeholder', () => {
        render(<Input placeholder="Enter value" />);
        expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument();                          
    });

    it('should call onChange when value changes', () => {
        const onChange = jest.fn();
        render(<Input onChange={onChange} />);
       fireEvent.change(document.querySelector('input')!, { target: { value: '2100' } });                     
        expect(onChange).toHaveBeenCalled();
    });

    it('should forward ref correctly', () => {
        const ref = React.createRef<HTMLInputElement>();
        render(<Input ref={ref} />);
        expect(ref.current).not.toBeNull();                                                                 
    });

    it('should pass type prop to input', () => {
        render(<Input type="number" />);
        expect(document.querySelector('input')).toHaveAttribute('type', 'number');                                      
    });

    it('should pass min and max props to input', () => {
        render(<Input type="number" min={0} max={100} />);
        const input = document.querySelector('input');
        expect(input).toHaveAttribute('min', '0');
        expect(input).toHaveAttribute('max', '100');                                            
    });

    it('should render label and suffix together', () => {                                         
        render(<Input label="Speed" suffix={<span>mm/s</span>} />);
        expect(screen.getByText('Speed')).toBeInTheDocument();
        expect(screen.getByText('mm/s')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
        render(<Input className="custom-class" />);
        expect(document.querySelector('input')).toHaveClass('custom-class');                               
    });

    it('should render disabled input', () => {
        render(<Input disabled />);                                                                      
        expect(document.querySelector('input')).toBeDisabled();
    });
});

// ───────────────────────────────────────────────────
// SpiralIcon Component
// ───────────────────────────────────────────────────
describe('SpiralIcon Component', () => {
    it('should render without crashing', () => {
        render(<SpiralIcon />);
        expect(document.querySelector('svg')).toBeInTheDocument();                            
    });

    it('should apply className prop', () => {
        render(<SpiralIcon className="test-class" />);
        expect(document.querySelector('svg')).toHaveClass('test-class');                    
    });

    it('should call onClick when clicked', () => {
        const onClick = jest.fn();
        render(<SpiralIcon onClick={onClick} />);
        fireEvent.click(document.querySelector('svg')!);
        expect(onClick).toHaveBeenCalledTimes(1);                                 
    });

    it('should forward ref correctly', () => {
        const ref = React.createRef<SVGSVGElement>();
        render(<SpiralIcon ref={ref} />);
        expect(ref.current).not.toBeNull();                                      
    });

    it('should render with checked prop true', () => {
        render(<SpiralIcon checked={true} />);
        expect(document.querySelector('svg')).toBeInTheDocument();              
    });

    it('should render with checked prop false', () => {
        render(<SpiralIcon checked={false} />);
        expect(document.querySelector('svg')).toBeInTheDocument();                
    });

    it('should render path inside svg', () => {
        render(<SpiralIcon />);
        expect(document.querySelector('path')).toBeInTheDocument();             
    });
});

// ────────────────────────────────────────────────────
// ZigZagIcon Component
// ────────────────────────────────────────────────────
describe('ZigZagIcon Component', () => {
    it('should render without crashing', () => {
        render(<ZigZagIcon />);
        expect(document.querySelector('svg')).toBeInTheDocument();                                     
    });

    it('should apply className prop', () => {
        render(<ZigZagIcon className="zigzag-class" />);
        expect(document.querySelector('svg')).toHaveClass('zigzag-class');                          
    });

    it('should call onClick when clicked', () => {
        const onClick = jest.fn();
        render(<ZigZagIcon onClick={onClick} />);
        fireEvent.click(document.querySelector('svg')!);
        expect(onClick).toHaveBeenCalledTimes(1);                                                    
    });

    it('should forward ref correctly', () => {
        const ref = React.createRef<SVGSVGElement>();                                              
        render(<ZigZagIcon ref={ref} />);
        expect(ref.current).not.toBeNull();
    });

    it('should render with checked prop true', () => {
        render(<ZigZagIcon checked={true} />);
        expect(document.querySelector('svg')).toBeInTheDocument();                               
    });

    it('should render with checked prop false', () => {
        render(<ZigZagIcon checked={false} />);
        expect(document.querySelector('svg')).toBeInTheDocument();                                     
    });

    it('should render path inside svg', () => {
        render(<ZigZagIcon />);
        expect(document.querySelector('path')).toBeInTheDocument();                                  
    });
});
