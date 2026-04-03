# Height Map Tool - UI Requirements

Based on mockup analysis dated 2026-01-22.

## Layout Changes

### 1. Single Column Layout
- Change from 2-column grid to single column layout
- Controls on left side, visualizer on right side of main app
- Remove the separate "Right Column - Visualizer and Status" section
- Grid Preview should be inline with other controls

### 2. Control Width Reduction
- Reduce width of input controls
- Remove excessive whitespace after labels
- More compact layout overall

### 3. Grid Preview Placement
- Grid Preview should be positioned after Segment Length control
- Should be part of the left column flow, not a separate section

### 4. Visualizer Integration
- Add a visualizer component on the right side showing the transformed toolpath
- This visualizer should update when "Generate G-code" is clicked
- Should show the height-map adjusted toolpath preview

## Button Changes

### Button Layout
All buttons should be at the bottom of the controls section in a single row.

### Button Definitions

1. **Run Probe Routine** (existing - no rename)
   - Icon: Probe/sensor icon
   - Tooltip: "Start probing routine to measure surface heights at grid points"
   - Color: Primary (blue)
   - Disabled when: Machine not connected or not idle

2. **Generate G-code** (renamed from "Apply Height Map")
   - Icon: Gear/cog or transform icon
   - Tooltip: "Apply height map adjustments to the loaded G-code file"
   - Color: Primary (blue)
   - Behavior:
     - Applies height map to file from main visualizer
     - Shows modified toolpath in the local visualizer (same screen)
     - Track if height map was already applied
     - On 2nd click: Show warning dialog "Height map has already been applied to this file. Applying again will compound the adjustments and may produce incorrect results. Continue anyway?"
     - User must confirm to proceed
   - Disabled when: No map data or no file loaded

3. **Load to Main Visualizer** (renamed from "Apply & Run")
   - Icon: Upload/export icon
   - Tooltip: "Load the height-map adjusted G-code to the main visualizer for running"
   - Color: Outline/Secondary
   - Behavior: Loads transformed G-code from local visualizer to main visualizer
   - Disabled when: No transformed G-code available

4. **Export G-code** (existing - no change in functionality)
   - Icon: Download icon
   - Tooltip: "Download the height-map adjusted G-code as a file"
   - Color: Outline/Secondary
   - Disabled when: No map data or no file loaded

### Button Colors - Consistency Rules
- Primary actions (Run Probe, Generate G-code): Blue background (`variant="primary"`)
- Secondary actions (Load to Main, Export): Outline style (`variant="outline"`)
- Destructive actions (Stop Probing): Red background
- Disabled buttons: Grayed out consistently

## Map Management Buttons
Keep existing buttons but ensure consistent styling:
- Save Map: Outline
- Load Map: Outline
- Clear Map: Outline

## State Tracking

### New State Properties
```typescript
interface HeightMapState {
  // ... existing properties
  heightMapApplied: boolean;  // Track if height map was applied to current file
  transformedGcode: string | null;  // Store the transformed G-code
  originalFileHash: string | null;  // Hash of original file to detect changes
}
```

### Reset Conditions
- `heightMapApplied` should reset to `false` when:
  - A new file is loaded in main visualizer
  - Map data is cleared
  - Map data is changed (re-probed or loaded different map)

## Visual Feedback

### Warnings Display
- Show warning when G-code extends outside map bounds
- Show warning when attempting to apply height map twice

### Status Indicators
- Show "Height map applied" status after generation
- Show transformed file info (name, size difference)

## Icons to Use
Use icons from existing icon library in the project (likely lucide-react or similar):
- Probe: `Crosshair` or `Target`
- Generate: `Cog` or `RefreshCw` or `Wand2`
- Load to Main: `Upload` or `ExternalLink`
- Export: `Download`
- Save Map: `Save`
- Load Map: `FolderOpen`
- Clear Map: `Trash2`

## Implementation Order

1. Update layout structure (single column, compact)
2. Add local visualizer component
3. Implement state tracking for height map application
4. Update button names and add icons
5. Add tooltips to all buttons
6. Implement warning dialog for double-application
7. Ensure button color consistency
8. Test all workflows
