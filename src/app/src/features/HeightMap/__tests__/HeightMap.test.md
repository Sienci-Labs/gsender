# Height Map Tool Test Plan

## Overview
This document outlines the comprehensive test plan for the Height Map Tool feature in gSender. The tool compensates for uneven stock surfaces by probing a grid and applying Z-offset adjustments to G-code files.

---

## 1. Unit Tests

### 1.1 Interpolation Module (`utils/interpolation.ts`)

#### `calculateProbeGrid()`
| Test ID | Description | Input | Expected Output |
|---------|-------------|-------|-----------------|
| INT-001 | Basic 3x3 grid with spacing | minX=0, maxX=20, minY=0, maxY=20, spacing=10, usePointCount=false | 9 points in zigzag pattern |
| INT-002 | 2x2 grid with point count | minX=0, maxX=100, minY=0, maxY=100, usePointCount=true, pointCountX=2, pointCountY=2 | 4 corner points |
| INT-003 | Non-divisible spacing | minX=0, maxX=25, minY=0, maxY=25, spacing=10 | Points at 0, 10, 20, 25 on each axis |
| INT-004 | Single column grid | minX=0, maxX=0, minY=0, maxY=100, spacing=10 | Points along Y axis only |
| INT-005 | Zigzag pattern verification | Any valid grid | Even rows L→R, odd rows R→L |

#### `bilinearInterpolate()`
| Test ID | Description | Input | Expected Output |
|---------|-------------|-------|-----------------|
| INT-010 | Center of 4 equal points | x=5, y=5, all Z=1.0 | Z=1.0 |
| INT-011 | Linear gradient X | x=5, y=0, Z varies 0→1 along X | Z=0.5 |
| INT-012 | Linear gradient Y | x=0, y=5, Z varies 0→1 along Y | Z=0.5 |
| INT-013 | Corner point exact | x=0, y=0 (exact probe point) | Exact probe Z value |
| INT-014 | Diagonal gradient | x=5, y=5, corners Z=0,1,1,2 | Z=1.0 (average) |
| INT-015 | Point outside bounds | x=-5, y=0 | null |

#### `getZOffset()`
| Test ID | Description | Input | Expected Output |
|---------|-------------|-------|-----------------|
| INT-020 | Valid point inside map | Valid x,y within bounds | Interpolated Z value |
| INT-021 | Null map data | mapData=null | 0 |
| INT-022 | Empty points array | mapData.points=[] | 0 |
| INT-023 | Point outside bounds | x,y outside map | 0 |

#### `isWithinBounds()`
| Test ID | Description | Input | Expected Output |
|---------|-------------|-------|-----------------|
| INT-030 | Point inside | x=50, y=50, bounds 0-100 | true |
| INT-031 | Point on boundary | x=0, y=0, bounds 0-100 | true |
| INT-032 | Point outside X | x=-1, y=50, bounds 0-100 | false |
| INT-033 | Point outside Y | x=50, y=101, bounds 0-100 | false |

---

### 1.2 Probe Routine Module (`utils/probeRoutine.ts`)

#### `generateSingleProbeCommand()`
| Test ID | Description | Input | Expected Output |
|---------|-------------|-------|-----------------|
| PRB-001 | Standard probe command | x=10, y=20, zClear=5, feed=100, depth=10 | Valid G-code with G38.2 |
| PRB-002 | Metric coordinates | x=10.123, y=20.456 | Coordinates rounded to 3 decimals |
| PRB-003 | Zero position probe | x=0, y=0 | Valid G-code at origin |

#### `createHeightMapFromProbeResults()`
| Test ID | Description | Input | Expected Output |
|---------|-------------|-------|-----------------|
| PRB-010 | Valid 2x2 results | 4 points, 4 Z values | HeightMapData with bounds/resolution |
| PRB-011 | Mismatched arrays | 4 points, 3 Z values | Error thrown |
| PRB-012 | Resolution calculation | 3x3 grid, 9 Z values | Correct resolution.x and resolution.y |

#### `normalizeHeightMap()`
| Test ID | Description | Input | Expected Output |
|---------|-------------|-------|-----------------|
| PRB-020 | Positive Z values | Z=[1, 2, 3, 4] | Z=[0, 1, 2, 3] |
| PRB-021 | Negative Z values | Z=[-2, -1, 0, 1] | Z=[0, 1, 2, 3] |
| PRB-022 | All same Z | Z=[5, 5, 5, 5] | Z=[0, 0, 0, 0] |
| PRB-023 | Empty points | mapData.points=[] | Original map returned |

#### `validateHeightMap()`
| Test ID | Description | Input | Expected Output |
|---------|-------------|-------|-----------------|
| PRB-030 | Valid 3x3 map | 9 points, valid bounds | { valid: true } |
| PRB-031 | Null map | null | { valid: false, error: "No height map data" } |
| PRB-032 | Empty points | points=[] | { valid: false, error } |
| PRB-033 | Less than 4 points | 3 points | { valid: false, error } |
| PRB-034 | 1D grid (line) | 5 points on single X | { valid: false, error } |

---

### 1.3 G-code Transformer Module (`utils/gcodeTransformer.ts`)

#### `transformGcode()`
| Test ID | Description | Input | Expected Output |
|---------|-------------|-------|-----------------|
| GCT-001 | Simple G1 move | "G1 X10 Y10 Z0" | Z adjusted by interpolated offset |
| GCT-002 | G0 rapid move | "G0 X10 Y10 Z5" | Z adjusted by interpolated offset |
| GCT-003 | Comment lines preserved | "; This is a comment" | Unchanged |
| GCT-004 | Empty lines preserved | "" | Unchanged |
| GCT-005 | Non-move commands | "M3 S1000" | Unchanged |
| GCT-006 | Long line segmentation | Line >segmentLength | Multiple segments generated |
| GCT-007 | Header comment added | Any G-code | Header with map info prepended |
| GCT-008 | G90/G91 mode tracking | Mixed abs/inc modes | Only absolute mode transformed |
| GCT-009 | Feed rate preservation | "G1 X10 F500" | F500 on first segment only |
| GCT-010 | Outside bounds warning | G-code outside map | Warning in result |

#### Segmentation Tests
| Test ID | Description | Input | Expected Output |
|---------|-------------|-------|-----------------|
| GCT-020 | Short line no segment | Line length < segmentLength | Single output line |
| GCT-021 | Exact segment length | Line = 2*segmentLength | 2 segments |
| GCT-022 | Fractional segments | Line = 2.5*segmentLength | 3 segments |
| GCT-023 | Diagonal line | X and Y both change | Correct segment endpoints |

#### `validateGcodeBounds()`
| Test ID | Description | Input | Expected Output |
|---------|-------------|-------|-----------------|
| GCT-030 | G-code within bounds | X[0-50], Y[0-50], map[0-100] | valid=true |
| GCT-031 | G-code exceeds X | X[0-150], map X[0-100] | valid=false |
| GCT-032 | G-code exceeds Y | Y[0-150], map Y[0-100] | valid=false |
| GCT-033 | Negative coordinates | X[-10-50], map[0-100] | valid=false |
| GCT-034 | No coordinates | No X/Y in G-code | gcodeMinX/Y = 0 |

---

## 2. Integration Tests

### 2.1 UI Component Tests

#### Grid Configuration
| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| UI-001 | Min/Max X input | Enter values 0 and 100 | State updates, grid preview shows bounds |
| UI-002 | Min/Max Y input | Enter values 0 and 100 | State updates, grid preview shows bounds |
| UI-003 | Use Current WPos | Click Min X button | Field populated with current X WPos |
| UI-004 | Use File Bounds | Click button with file loaded | All bounds set from file bbox |
| UI-005 | Use File Bounds no file | Click button without file | Warning displayed |
| UI-006 | Switch to point count mode | Toggle switch | Point count inputs appear |
| UI-007 | Grid spacing input | Enter 10mm | Grid preview updates with correct spacing |

#### Probing Safety
| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| UI-010 | Z Clearance input | Enter 5mm | Value stored in state |
| UI-011 | Probe Feed Rate input | Enter 100mm/min | Value stored in state |
| UI-012 | Max Probe Depth input | Enter 10mm | Value stored in state |

#### Map Management
| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| UI-020 | Save Map button | Click with valid map | JSON file downloaded |
| UI-021 | Save Map disabled | No map data | Button disabled |
| UI-022 | Load Map valid file | Select valid JSON | Map loaded, status updated |
| UI-023 | Load Map invalid file | Select invalid JSON | Error warning displayed |
| UI-024 | Clear Map button | Click with map data | Map cleared, status shows "Empty" |
| UI-025 | Map status display | After successful probe | Shows "Valid (NxM, X points)" |

#### Visualization
| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| UI-030 | Grid preview empty | No probing done | Gray dots at grid points |
| UI-031 | Grid preview probed | After probing | Color-coded Z values |
| UI-032 | Current probe indicator | During probing | Gold dot with border at current point |
| UI-033 | Progress bar | During probing | Shows progress percentage |
| UI-034 | Point count display | Any configuration | Shows total probe points |

---

### 2.2 Probing Workflow Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| PW-001 | Start probing | Click "Run Probe Routine" | Probing begins, progress shown |
| PW-002 | Probing disabled when running | During active probe | Start button disabled |
| PW-003 | Abort probing | Click "Stop Probing" | Probing stops, partial data retained |
| PW-004 | Complete probing | Wait for all points | Map created, status shows "Valid" |
| PW-005 | Insufficient points | Grid < 4 points | Warning displayed, probing not started |
| PW-006 | Probe error handling | Probe fails to trigger | Error state, probing stops |
| PW-007 | Machine not idle | Machine in Run state | Start button disabled |

---

### 2.3 G-code Transformation Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| TF-001 | Apply to loaded file | Valid map, file loaded | Transformed G-code in secondary visualizer |
| TF-002 | Apply without map | No map data | Warning "No height map data" |
| TF-003 | Apply without file | No file loaded | Warning "No G-code file loaded" |
| TF-004 | Bounds warning | G-code exceeds map | Warning about zero offset outside bounds |
| TF-005 | Load to main visualizer | Click button | Transformed G-code loaded, navigate to main |
| TF-006 | Multiple applications | Apply twice to different files | Both files transformed correctly |
| TF-007 | Segment length effect | Change segment length | Different number of output lines |

---

## 3. End-to-End Tests

### 3.1 Complete Workflow - PCB Milling Scenario

| Step | Action | Verification |
|------|--------|--------------|
| 1 | Connect to machine | Connection established |
| 2 | Navigate to Tools > Height Map | Height Map tool opens |
| 3 | Set grid bounds: X[0-80], Y[0-100] | Values shown in inputs |
| 4 | Set grid spacing: 10mm | 81 probe points shown |
| 5 | Set Z clearance: 3mm | Value stored |
| 6 | Set probe feed: 75mm/min | Value stored |
| 7 | Set max depth: 5mm | Value stored |
| 8 | Click "Run Probe Routine" | Machine begins probing |
| 9 | Wait for completion | Progress reaches 100% |
| 10 | Verify map status | Shows "Valid (9x11, 99 points)" |
| 11 | Load PCB G-code file | File appears in visualizer |
| 12 | Click "Apply to Loaded File" | Transformed G-code preview |
| 13 | Click "Load to Main Visualizer" | Navigate to main, file loaded |
| 14 | Run the job | Z heights adjusted during cut |

### 3.2 Batch User Scenario - Saved Map Reuse

| Step | Action | Verification |
|------|--------|--------------|
| 1 | Complete probing workflow | Valid map created |
| 2 | Click "Save Map" | JSON file downloaded |
| 3 | Clear map | Status shows "Empty" |
| 4 | Click "Load Map" | Select saved JSON |
| 5 | Verify map loaded | Status shows original dimensions |
| 6 | Load different G-code file | New file in visualizer |
| 7 | Apply height map | Transformed correctly |
| 8 | Repeat for multiple files | All files transformed with same map |

---

## 4. Edge Cases and Error Handling

### 4.1 Input Validation
| Test ID | Description | Input | Expected Behavior |
|---------|-------------|-------|-------------------|
| EC-001 | Negative grid bounds | minX = -10 | Accepted (valid for some setups) |
| EC-002 | Min > Max | minX=100, maxX=0 | Grid inverted or warning |
| EC-003 | Zero grid spacing | spacing=0 | Minimum enforced (0.1) |
| EC-004 | Huge grid | 1000x1000 points | Performance warning or limit |
| EC-005 | Point count = 1 | pointCountX=1 | Minimum enforced (2) |

### 4.2 Machine States
| Test ID | Description | Machine State | Expected Behavior |
|---------|-------------|---------------|-------------------|
| EC-010 | Idle machine | Idle | All functions enabled |
| EC-011 | Jogging machine | Jog | Buttons enabled |
| EC-012 | Running job | Run | Buttons disabled |
| EC-013 | Alarm state | Alarm | Buttons disabled |
| EC-014 | Disconnected | No connection | Buttons disabled |

### 4.3 File Handling
| Test ID | Description | Scenario | Expected Behavior |
|---------|-------------|----------|-------------------|
| EC-020 | Very large G-code | 100MB file | Async processing, no UI freeze |
| EC-021 | G-code with arcs | G2/G3 commands | Arcs preserved (not transformed) |
| EC-022 | Incremental mode | G91 sections | Sections skipped (warning optional) |
| EC-023 | Mixed units | G20/G21 in file | Units tracked correctly |
| EC-024 | No XY moves | Z-only file | File unchanged |

---

## 5. Performance Tests

| Test ID | Description | Metric | Target |
|---------|-------------|--------|--------|
| PF-001 | Grid calculation 10x10 | Time | < 10ms |
| PF-002 | Grid calculation 50x50 | Time | < 100ms |
| PF-003 | Interpolation 1000 calls | Time | < 50ms |
| PF-004 | Transform 10K lines | Time | < 1s |
| PF-005 | Transform 100K lines | Time | < 10s |
| PF-006 | UI responsiveness during transform | Frame rate | > 30fps |
| PF-007 | Memory usage large map | RAM | < 50MB additional |

---

## 6. Regression Tests

### 6.1 Existing Functionality
| Test ID | Description | Verification |
|---------|-------------|--------------|
| RG-001 | Surfacing tool unaffected | Surfacing still works |
| RG-002 | Probe tool unaffected | Standard probing works |
| RG-003 | File loading unaffected | Files load normally |
| RG-004 | Visualizer unaffected | 3D view renders correctly |
| RG-005 | Settings persistence | Other settings preserved |

### 6.2 Navigation
| Test ID | Description | Verification |
|---------|-------------|--------------|
| RG-010 | Tools menu contains Height Map | Card visible |
| RG-011 | Height Map route works | /tools/height-map loads |
| RG-012 | Back button works | Returns to tools menu |
| RG-013 | Direct URL access | Route loads correctly |

---

## 7. Accessibility Tests

| Test ID | Description | Verification |
|---------|-------------|--------------|
| AC-001 | Keyboard navigation | All inputs focusable via Tab |
| AC-002 | Input labels | All inputs have visible labels |
| AC-003 | Button states | Disabled buttons visually distinct |
| AC-004 | Color contrast | Text readable in light/dark mode |
| AC-005 | Progress announcements | Screen reader announces progress |

---

## 8. Test Data

### Sample Height Map JSON
```json
{
  "bounds": {
    "minX": 0,
    "maxX": 100,
    "minY": 0,
    "maxY": 100
  },
  "resolution": {
    "x": 50,
    "y": 50
  },
  "points": [
    { "x": 0, "y": 0, "z": 0.1 },
    { "x": 50, "y": 0, "z": 0.2 },
    { "x": 100, "y": 0, "z": 0.15 },
    { "x": 100, "y": 50, "z": 0.3 },
    { "x": 50, "y": 50, "z": 0.25 },
    { "x": 0, "y": 50, "z": 0.2 },
    { "x": 0, "y": 100, "z": 0.1 },
    { "x": 50, "y": 100, "z": 0.15 },
    { "x": 100, "y": 100, "z": 0.2 }
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "units": "mm"
}
```

### Sample G-code for Testing
```gcode
; Test file for height map
G21 ; Metric
G90 ; Absolute
G0 Z5 ; Safe height
G0 X0 Y0 ; Start position
G1 Z0 F100 ; Plunge
G1 X100 Y0 F500 ; Long line (should segment)
G1 X100 Y100 ; Diagonal
G1 X0 Y100
G1 X0 Y0 ; Return
G0 Z5 ; Retract
M30 ; End
```

---

## 9. Sign-off Checklist

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] End-to-end workflows verified
- [ ] Edge cases handled gracefully
- [ ] Performance targets met
- [ ] No regressions in existing functionality
- [ ] Code review completed
- [ ] Documentation updated
