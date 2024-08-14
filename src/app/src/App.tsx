import { useState } from 'react';
import RangeSlider from './components/RangeSlider';
import './index.css';
// import TestSlider from './TestSlider';

function App() {
    const [value, setValue] = useState([50]);
    return (
        <div className="flex w-96 h-full justify-center items-center mt-10">
            <RangeSlider
                title='Feed'
                min={10}
                max={100}
                value={value}
                defaultValue={[50]}
                colour='red'
                unitString="mm/min"
                step={10}
                onChange={(values) => {
                    setValue(values);
                }}
                onMouseUp={() => {}}
                showValues={true}
            />
            {/* <TestSlider /> */}
        </div>
    );
}

export default App;
