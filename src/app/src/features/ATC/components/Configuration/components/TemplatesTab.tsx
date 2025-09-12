import React, { useState, useRef } from 'react';
import { Button } from 'app/components/Button';
import { Badge } from 'app/components/shadcn/badge';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import cn from 'classnames';

interface Template {
    name: string;
    content: string;
}

interface TemplateData {
    version: string;
    templates: Template[];
}

export const TemplatesTab: React.FC = () => {
    const [templateData, setTemplateData] = useState<TemplateData | null>({
        version: '20250909',
        templates: [
            {
                name: 'ATCI.json',
                content: `{
  "toolChangeConfig": {
    "enabled": true,
    "timeout": 30000,
    "retryCount": 3
  },
  "sensors": {
    "toolLengthSensor": {
      "position": [625.7, -27.4, -175.4],
      "enabled": true
    },
    "pressureSensor": {
      "enabled": true,
      "threshold": 0.5
    }
  },
  "safety": {
    "checkToolPresence": true,
    "verifyLength": false
  }
}`,
            },
            {
                name: 'P200.macro',
                content: `; Tool Change Initialization Macro
; P200 - Initialize tool change system

G90 ; Absolute positioning
G21 ; Metric units

; Check system status
M5 ; Stop spindle
M9 ; Coolant off

; Move to safe position
G53 G0 Z0 ; Move to machine home Z
G53 G0 X625.7 Y-27.4 ; Move to tool change position

; Initialize tool change variables
#100 = 0 ; Current tool number
#101 = 0 ; Target tool number
#102 = 0 ; Tool change status

; Signal ready for tool change
M68 E0 Q1 ; Set tool change ready signal

(MSG, Tool change system initialized)`,
            },
            {
                name: 'P300.macro',
                content: `; Manual Tool Load Macro
; P300 - Load tool manually

; Parameters:
; #1 = Tool number to load

G90 ; Absolute positioning

; Validate tool number
O100 IF [#1 LE 0]
  (MSG, Invalid tool number)
  M30
O100 ENDIF

; Move to manual tool load position
G53 G0 Z0
G53 G0 X625.7 Y-27.4
G53 G0 Z-175.4

; Stop and wait for manual tool insertion
M0 (Insert tool #1 and press cycle start)

; Set current tool
T#1 M6

; Update tool offset if enabled
O200 IF [#<_tool_offset_enable> EQ 1]
  G43 H#1
O200 ENDIF

(MSG, Tool #1 loaded successfully)`,
            },
            {
                name: 'P301.macro',
                content: `; Tool Length Probe Macro
; P301 - Probe tool length

; Parameters:
; #1 = Tool number
; #2 = Probe feedrate (optional, default 100)

; Set default feedrate if not specified
O100 IF [#2 EQ #<_undefined>]
  #2 = 100
O100 ENDIF

G90 ; Absolute positioning
G21 ; Metric units

; Move to tool length sensor position
G53 G0 Z0
G53 G0 X625.7 Y-27.4
G53 G0 Z-100 ; Approach position

; Probe down to find tool length
G38.2 Z-200 F#2

; Check if probe was successful
O200 IF [#5070 EQ 0]
  (MSG, Tool length probe failed)
  M30
O200 ENDIF

; Calculate and set tool offset
#[2000 + #1] = #5063 ; Store tool length in offset table

; Retract from sensor
G53 G0 Z0

(MSG, Tool #1 length measured: #5063)`,
            },
            {
                name: 'P500.macro',
                content: `; Tool Rack Position Macro
; P500 - Calculate tool rack slot position

; Parameters:
; #1 = Slot number (1-8)
; Returns position in #100, #101, #102 (X, Y, Z)

; Validate slot number
O100 IF [#1 LT 1 OR #1 GT 8]
  (MSG, Invalid slot number. Must be 1-8)
  M30
O100 ENDIF

; Base position for slot 1
#110 = 625.7  ; Base X position
#111 = -27.4  ; Base Y position  
#112 = -175.4 ; Base Z position

; Slot spacing
#113 = 50.0   ; X spacing between slots
#114 = 0.0    ; Y spacing between slots
#115 = 0.0    ; Z spacing between slots

; Calculate position for requested slot
#100 = #110 + [#1 - 1] * #113 ; X position
#101 = #111 + [#1 - 1] * #114 ; Y position
#102 = #112 + [#1 - 1] * #115 ; Z position

(DEBUG, Slot #1 position: X#100 Y#101 Z#102)`,
            },
            {
                name: 'P501.macro',
                content: `; Tool Rack Load Macro
; P501 - Load tool from rack slot

; Parameters:
; #1 = Slot number (1-8)
; #2 = Tool number

; Calculate slot position
M98 P500 L1 Q#1

; Check if tool is present in slot
O100 IF [#<_tool_presence_check> EQ 1]
  ; Move to slot position for presence check
  G53 G0 Z0
  G53 G0 X#100 Y#101
  G53 G0 Z[#102 + 10] ; Approach position
  
  ; Check tool presence sensor
  M66 P1 L3 Q5 ; Wait for tool presence signal
  O110 IF [#5399 EQ -1]
    (MSG, No tool found in slot #1)
    M30
  O110 ENDIF
O100 ENDIF

; Move to slot position
G53 G0 Z0
G53 G0 X#100 Y#101
G53 G0 Z#102

; Engage tool holder
M64 P0 ; Activate tool clamp
G4 P1.0 ; Wait 1 second

; Lift tool from rack
G53 G0 Z[#102 + 20]

; Set current tool
T#2 M6

(MSG, Tool #2 loaded from slot #1)`,
            },
            {
                name: 'P502.macro',
                content: `; Tool Rack Store Macro
; P502 - Store tool in rack slot

; Parameters:
; #1 = Slot number (1-8)
; #2 = Tool number

; Calculate slot position
M98 P500 L1 Q#1

; Check if slot is empty
O100 IF [#<_tool_presence_check> EQ 1]
  ; Move to slot position for presence check
  G53 G0 Z0
  G53 G0 X#100 Y#101
  G53 G0 Z[#102 + 10] ; Approach position
  
  ; Check tool presence sensor
  M66 P1 L3 Q1 ; Wait for tool presence signal
  O110 IF [#5399 NE -1]
    (MSG, Slot #1 is not empty)
    M30
  O110 ENDIF
O100 ENDIF

; Move to slot position
G53 G0 Z0
G53 G0 X#100 Y#101
G53 G0 Z[#102 + 20] ; Approach position

; Lower tool into slot
G53 G0 Z#102

; Release tool holder
M65 P0 ; Deactivate tool clamp
G4 P1.0 ; Wait 1 second

; Retract from slot
G53 G0 Z0

; Clear current tool
T0 M6

(MSG, Tool #2 stored in slot #1)`,
            },
            {
                name: 'P503.macro',
                content: `; Tool Rack Verify Macro
; P503 - Verify all tools in rack

; Initialize verification variables
#120 = 0 ; Tools found count
#121 = 0 ; Empty slots count
#122 = 0 ; Error count

; Loop through all 8 slots
#130 = 1 ; Slot counter

O100 WHILE [#130 LE 8]
  ; Calculate slot position
  M98 P500 L1 Q#130
  
  ; Move to slot position
  G53 G0 Z0
  G53 G0 X#100 Y#101
  G53 G0 Z[#102 + 10] ; Approach position
  
  ; Check tool presence
  M66 P1 L3 Q1 ; Wait for presence signal
  
  O110 IF [#5399 NE -1]
    #120 = #120 + 1 ; Increment tools found
    (DEBUG, Tool found in slot #130)
  O110 ELSE
    #121 = #121 + 1 ; Increment empty slots
    (DEBUG, Slot #130 is empty)
  O110 ENDIF
  
  #130 = #130 + 1 ; Next slot
O100 ENDWHILE

; Return to safe position
G53 G0 Z0

; Report results
(MSG, Verification complete: #120 tools found, #121 empty slots)

; Store results in global variables
#<_rack_tools_found> = #120
#<_rack_empty_slots> = #121`,
            },
            {
                name: 'P900.macro',
                content: `; Emergency Tool Release Macro
; P900 - Emergency tool release procedure

(MSG, EMERGENCY TOOL RELEASE ACTIVATED)

; Stop all motion immediately
M0 ; Program stop

; Turn off spindle and coolant
M5 ; Spindle stop
M9 ; Coolant off

; Release tool clamp
M65 P0 ; Deactivate tool clamp
G4 P2.0 ; Wait 2 seconds

; Move to safe position slowly
G53 G1 Z0 F100 ; Slow move to Z home

; Clear current tool
T0 M6

; Reset tool change variables
#100 = 0 ; Current tool
#101 = 0 ; Target tool
#102 = 0 ; Status

; Clear tool change ready signal
M68 E0 Q0

; Sound alarm
M68 E1 Q1 ; Activate alarm output
G4 P3.0 ; Sound for 3 seconds
M68 E1 Q0 ; Deactivate alarm

(MSG, Emergency tool release complete - Check tool manually)

; Require operator acknowledgment
M0 (Check tool and press cycle start to continue)`,
            },
            {
                name: 'P901.macro',
                content: `; System Diagnostics Macro
; P901 - Run system diagnostics

(MSG, Starting system diagnostics...)

; Test 1: Check tool change position accuracy
(MSG, Testing tool change position...)
G53 G0 Z0
G53 G0 X625.7 Y-27.4
G53 G0 Z-175.4

; Verify position
#140 = #5021 ; Current X position
#141 = #5022 ; Current Y position  
#142 = #5023 ; Current Z position

#143 = ABS[#140 - 625.7] ; X error
#144 = ABS[#141 - [-27.4]] ; Y error
#145 = ABS[#142 - [-175.4]] ; Z error

(DEBUG, Position errors: X#143 Y#144 Z#145)

; Test 2: Check sensor inputs
(MSG, Testing sensors...)
M66 P0 L3 Q1 ; Test tool length sensor
#146 = #5399 ; Sensor state
(DEBUG, Tool length sensor state: #146)

M66 P1 L3 Q1 ; Test tool presence sensor
#147 = #5399 ; Sensor state
(DEBUG, Tool presence sensor state: #147)

; Test 3: Check outputs
(MSG, Testing outputs...)
M68 E0 Q1 ; Test tool change ready signal
G4 P1.0
M68 E0 Q0

M64 P0 ; Test tool clamp
G4 P1.0
M65 P0

; Test 4: Verify tool rack positions
(MSG, Verifying tool rack positions...)
#150 = 1 ; Slot counter
O200 WHILE [#150 LE 8]
  M98 P500 L1 Q#150 ; Calculate position
  (DEBUG, Slot #150: X#100 Y#101 Z#102)
  #150 = #150 + 1
O200 ENDWHILE

; Return to safe position
G53 G0 Z0

(MSG, System diagnostics complete - Check debug output)

; Store diagnostic results
#<_diag_pos_error_x> = #143
#<_diag_pos_error_y> = #144
#<_diag_pos_error_z> = #145
#<_diag_sensor_tls> = #146
#<_diag_sensor_presence> = #147`,
            },
        ],
    });
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
        templateData?.templates[0] || null,
    );
    const [uploadError, setUploadError] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const defaultVersion = '20250909';
    const versionMismatch =
        templateData && templateData.version !== defaultVersion;

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.json')) {
            setUploadError('Please select a valid JSON file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content) as TemplateData;

                // Validate the structure
                if (!data.version || !Array.isArray(data.templates)) {
                    throw new Error('Invalid template file structure');
                }

                setTemplateData(data);
                setSelectedTemplate(data.templates[0] || null);
                setUploadError('');
            } catch (error) {
                setUploadError('Invalid JSON file or incorrect structure');
                console.error('Template upload error:', error);
            }
        };
        reader.readAsText(file);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const renderLineNumbers = (content: string) => {
        const lines = content.split('\n');
        return lines.map((line, index) => (
            <div key={index} className="flex whitespace-nowrap">
                <span className="text-gray-400 text-xs mr-3 select-none w-8 text-right">
                    {index + 1}
                </span>
                <span className="text-xs whitespace-pre">{line}</span>
            </div>
        ));
    };

    return (
        <div className="space-y-4 flex flex-col h-full">
            {/* Upload Area and Version Row */}
            <div className="grid grid-cols-2 gap-2">
                {/* Version Info - Left Half */}
                <div className="border border-border">
                    <div className="py-2 flex items-center justify-center h-full">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">
                                    Template Version:
                                </span>
                                <Badge
                                    variant="secondary"
                                    className={cn(
                                        'text-sm font-bold px-3 py-1',
                                        versionMismatch
                                            ? 'bg-red-500 text-white'
                                            : 'bg-blue-100 text-blue-800',
                                    )}
                                >
                                    {templateData?.version || defaultVersion}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">
                                    Reported Version:
                                </span>
                                <Badge
                                    variant="secondary"
                                    className={cn(
                                        'text-sm font-bold px-3 py-1',
                                        versionMismatch
                                            ? 'bg-red-500 text-white'
                                            : 'border-gray-300 text-gray-600',
                                    )}
                                >
                                    {defaultVersion}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Import Button - Right Half */}
                <div className="border border-border">
                    <div className="py-2 flex items-center justify-center h-full">
                        <Button
                            onClick={handleUploadClick}
                            className="w-full flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
                        >
                            <Upload className="h-4 w-4" />
                            Upload JSON Template File
                        </Button>

                        {/* Error Message */}
                        {uploadError && (
                            <div className="flex items-center gap-2 text-red-500 text-xs mt-2">
                                <AlertCircle className="h-4 w-4" />
                                {uploadError}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 flex-1 min-h-0 h-0">
                {/* Macro Listing */}
                <div className="border border-border md:col-span-2 flex flex-col h-full">
                    <h1 className="text-sm font-semibold text-blue-500 p-2">
                        Macros ({templateData?.templates.length || 0})
                    </h1>

                    <div className="p-0 flex-1 min-h-0">
                        <div className="h-full overflow-y-auto">
                            {templateData?.templates.map((template, index) => (
                                <button
                                    key={index}
                                    onClick={() =>
                                        setSelectedTemplate(template)
                                    }
                                    className={cn(
                                        'w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-100 flex items-center gap-2 transition-colors',
                                        selectedTemplate?.name ===
                                            template.name &&
                                            'bg-blue-50 border-blue-200',
                                    )}
                                >
                                    <FileText className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium">
                                        {template.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Contents */}
                <div className="border border-border md:col-span-3 flex flex-col h-full">
                    <h1 className="text-sm font-semibold p-2 text-blue-500">
                        {selectedTemplate ? selectedTemplate.name : 'Content'}
                    </h1>

                    <div className="flex-1">
                        <div className="bg-gray-50 border rounded m-2 h-full overflow-auto">
                            {selectedTemplate ? (
                                <div className="font-mono text-xs space-y-0 whitespace-nowrap p-3">
                                    {renderLineNumbers(
                                        selectedTemplate.content,
                                    )}
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground text-sm py-8">
                                    Select a macro to view its contents
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
            />
        </div>
    );
};
