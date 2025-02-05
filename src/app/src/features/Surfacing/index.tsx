import { useState } from 'react';

import { Input } from 'app/components/shadcn/Input';
import { Label } from 'app/components/shadcn/Label';
import { Button } from 'app/components/shadcn/Button';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from 'app/components/shadcn/Tabs';
import { Switch } from 'app/components/shadcn/Switch';

// import Generator from './utils/surfacingGcodeGenerator';
import { GcodeViewer } from './components/GcodeViewer';

const SurfacingTool = () => {
    const [dimensions, setDimensions] = useState({
        x: 40.98,
        y: 40.98,
        cutDepth: 0.04,
        maxDepth: 0.98,
        bitDiameter: 0.98,
        spindleRPM: 17000,
        feedrate: 98.43,
        stepover: 40,
    });

    const [gcode, setGcode] = useState('');

    const handleGenerateGcode = () => {
        // const generator = new Generator({
        //     surfacing: dimensions,
        //     units: 'mm',
        // });
        // setGcode(generator.generate());
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Surfacing Tool</h2>

            <div className="grid grid-cols-2 gap-4 py-4">
                <div>
                    <p>
                        For ideal wasteboard surfacing: know your CNCs exact
                        movement limits (account for limit switches and other
                        add-ons), use your widest diameter bit for nicer and 
                        faster cuts, and consider turning off hard and soft 
                        limits to avoid alarms or errors.
                    </p>

                    <div className="flex gap-2 items-center mb-4">
                        <Label className="min-w-32">X & Y Size</Label>

                        <div className="flex gap-2 items-center">
                            <Input type="number" />
                            <span>&</span>
                            <Input type="number" />
                            <span>in</span>
                        </div>
                    </div>

                    <div className="flex gap-2 items-center mb-4">
                        <Label className="min-w-32">Cut Depth</Label>

                        <div className="flex gap-2 items-center">
                            <Input type="number" />
                            <span>&</span>
                            <Input type="number" />
                            <span>in</span>
                        </div>
                    </div>

                    <div className="flex gap-2 items-center mb-4">
                        <Label className="min-w-32">Bit Diameter</Label>

                        <div className="flex gap-2 items-center w-full">
                            <Input type="number" />
                            <span>in</span>
                        </div>
                    </div>

                    <div className="flex gap-2 items-center mb-4">
                        <Label className="min-w-32">Spindle RPM</Label>

                        <div className="flex gap-4 items-center w-full">
                            <Input type="number" />

                            <div className="flex gap-2 items-center min-w-32 justify-between">
                                <Label>Add Delay</Label>
                                <Switch />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 items-center mb-4">
                        <Label className="min-w-32">Feed Rate</Label>

                        <div className="flex gap-2 items-center w-full">
                            <Input type="number" />
                            <span>in/min</span>
                        </div>
                    </div>

                    <div className="flex gap-2 items-center">
                        <Label className="min-w-32">Step Over</Label>

                        <div className="flex gap-2 items-center w-full">
                            <Input type="number" />
                            <span>%</span>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="gcode-viewer">
                    <TabsList>
                        <TabsTrigger value="gcode-viewer">
                            G-code Viewer
                        </TabsTrigger>
                        <TabsTrigger value="visualizer-preview">
                            Visualizer Preview
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent
                        value="gcode-viewer"
                        className="h-[400px] border rounded relative"
                    >
                        <GcodeViewer gcode={gcode} />
                    </TabsContent>
                    <TabsContent
                        value="visualizer-preview"
                        className="h-[400px] border rounded"
                    >
                        {/* Add visualization here */}
                    </TabsContent>
                </Tabs>
            </div>

            <div className="flex justify-between">
                <Button variant="outline" onClick={handleGenerateGcode}>
                    Generate G-code
                </Button>
                <Button onClick={() => {}}>Run on Main Visualizer</Button>
            </div>
        </div>
    );
};

export default SurfacingTool;
