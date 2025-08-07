# SD Card Design

## Overview
A single-page tool designed for technical users to manage files on an SD card. The interface should be minimal, intuitive, and responsive across resolutions from 1024px to 1920px. Primary actions use `blue-500` for visual emphasis.

## Design Goals
- **Minimal UI**: Sparse layout tailored for technical users.
- **Responsiveness**: Clean rendering across desktop resolutions.
- **Simplicity**: Clear, direct interactions with minimal friction.
- **Performance**: Efficient state management using Redux and React Context.

## Functional Requirements

### Status Indicator
- Displays current SD card status: `Mounted` or `Unmounted`.
- Should update dynamically if mounting status changes unexpectedly (e.g., module failure).
- Mounting status is derived from the complete status report.
- No polling required; status updates are already handled externally.

### Action Buttons

| Button        | Condition        | Behavior |
|---------------|------------------|----------|
| Mount         | If unmounted     | Sends mount command |
| Re-mount      | If mounted       | Sends re-mount command |
| Refresh Files | Always visible   | Sends `$F` command to refresh file list (clears current array to avoid duplicates) |
| Upload        | Always visible   | Opens modal to select and upload one or more files to SD |

**Upload Modal:**
- Accepts files with extensions: `.gcode`, `.nc`, `.macro`
- Modal should support drag-and-drop and manual selection

### File Listing
- Displays list of files on the SD card
- Each entry includes:
    - **Name** (string)
    - **Size** (number, shown in human-readable format)
    - **Run Button**: Executes the file
    - **Delete Button**: Prompts user for confirmation before deletion

**Behavior:**
- File list is refreshed by sending `$F` after any upload or delete action
- Sorting is by **name only**, ascending order

## State Management

### Redux Store

```ts
interface File {
  name: string;
  size: number;
}

interface AppState {
  files: File[];
  isMounted: boolean;
}
