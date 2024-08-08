import { useState } from 'react';
import RangeSlider from './components/RangeSlider';
import './index.css';
// import TestSlider from './TestSlider';

function App() {
    const [value, setValue] = useState(0);
    return (
        <div className="flex w-full h-full justify-center items-center mt-10">
            <RangeSlider 
                min={0}
                max={100}
                value={value}
                unitString="mm"
                step={10}
                onChange={(e) => {
                    setValue(Number(e.target.value));
                }}
                onMouseUp={() => {}}
            />
            {/* <TestSlider /> */}
        </div>
    );
}

export default App;
