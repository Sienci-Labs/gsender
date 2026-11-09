# Pendant Carve Screen Redesign: Implementation Spec

**Audience:** a coding agent implementing this in the gSender repo.
**Design source:** the "Pendant Carve Screen" mockup, 12 panels: https://claude.ai/code/artifact/78f9a34d-0991-4f02-aa14-eba84c361892
**Code baseline:** branch `features/helper_improvements` (commit `5b37128`). The pendant lives in `src/pendant/src`. It imports desktop code through the `app/…` alias, which points at `src/app/src`.
**Implemented on:** `features/android_v2`. Branch deltas vs. the baseline are logged in §11 (D-rows).
**Target device:** Android tablet, 10–11", portrait, about 810×1080 pt. Workshop dark theme only.

---

## 0. Ground rules (read first)

1. **Reuse before you build.** For every element, use the first option that works:
   1. **Mount the desktop component as-is** (`app/features/...`). Wrap it for layout only.
   2. **Use the existing pendant component** (`src/pendant/src/components/...`), moved into its new place in the layout.
   3. **Write a new presentational component** that calls the *existing* hooks, utils and handlers. Extract a handler into a hook if needed, but don't rewrite its logic.
   4. Write new logic only where §9 says "NEW LOGIC".
2. **Do not change desktop rendering or behaviour.** If a shared desktop component (for example `ControlButton`) needs a new look on the pendant, add an *optional* prop whose default reproduces today's desktop output exactly. Desktop screens must be pixel-identical afterwards.
3. **Do not change any controller command, gating rule or socket event.** The one exception is adding `rapidOverride` (§6.3). If the mockup copy disagrees with the code (labels, ranges), the **code wins**. Log each disagreement in §11.
4. **Keep the code for features that are not in the mockups (§10).**
   - Do not delete, rename or refactor those files.
   - Build the new layout in a new folder, `src/pendant/src/components/carve/`.
   - Leave the old `CarveView`, `BottomDrawer`, `DROCard` and similar untouched and importable.
   - Add a flag `pendant.legacyCarve` (default `false`, read from `app/store`). When it's `true`, `PendantShell` renders the old `CarveView`, so nothing is lost while the parked features get tallied.
5. **Tokens, not hex.** Add the missing tokens (§2) to the **pendant** Tailwind config only. The one documented exception is the override fader (§6.3), which uses its own literal values.
6. Run type-check and lint (`biome`) after every phase. Don't move to the next phase while either has errors.

---

## 1. Screen anatomy

```
┌──────────────────────────────────────────────┐
│ TopBar: [StatusBadge▾]   14:32:07  [Home][E-STOP] │  ~44px
├──────────────────────────────────────────────┤
│ Visualizer (42% of screen height, full width)│
│  [file chip]                   [info strip]  │
│  [Start|Pause|Resume][Stop]   (state ring)   │
├──────────────────────┬───────────────────────┤
│ Left column (44%)    │ Right column (56%)    │
│  content depends on CarveMode (§3)           │
├──────────────────────┴───────────────────────┤
│ BottomNav: Carve · Tools · Config (unchanged)│
└──────────────────────────────────────────────┘
```

- The `InfoStrip` row is **removed from `PendantShell`**. Its content moves onto the visualizer (§5.2). The old component stays in place (§10).
- `BottomNav`, `PendantToolsView` and `PendantConfigView` keep their logic. Restyling `BottomNav` to the dot style is optional.
- Keep these mounted in `PendantShell`: `JobCompletionAlert`, `ConfirmationDialog`, `Toaster`.

### Component tree to create

```
components/carve/
  CarveScreen.tsx            // replaces CarveView when !legacyCarve
  useCarveMode.ts            // §3
  topbar/CarveTopBar.tsx, StatusBadge.tsx, TopBarClock.tsx
  viz/VizStage.tsx, FileChip.tsx, InfoGlass.tsx, VizJobControls.tsx
  setup/SetupTabs.tsx, FileTab.tsx, PositionTab.tsx, ToolsTab.tsx,
        PrepTab.tsx, ConsoleTab.tsx, MacrosTab.tsx, JogArea.tsx
  run/RunLeft.tsx, RunRight.tsx, IsoFader.tsx, RapidPresets.tsx, ReadOnlyConsole.tsx
  locked/LockedNotice.tsx, AlarmHelperCard.tsx, HoldCard.tsx
  toolchange/TcLeft.tsx, TcRight.tsx
```

---

## 2. Design tokens

The mockup's token values are on its `:root`. These already exist in `src/app/tailwind.config.ts` and reach the pendant through `presets`, so reuse them: `surface.*`, `content.*`, `outline.*`, `robin.*`, `blue.*`.

These **do not exist** yet. Add them under `theme.extend.colors` in `src/pendant/tailwind.config.ts`:

| Token | Value | Use |
|---|---|---|
| `state.idle` | `#6b7280` | Idle tile |
| `state.run` | `#059669` | Run/Jog, Start/Resume, spindle override |
| `state.hold` | `#ca8a04` | Hold/Door |
| `state.alarm` | `#dc2626` | Alarm |
| `state.pause` | `#ea580c` | Pause button only |
| `state.tool` | `#534ab7` | Tool-change badge/wizard |
| `axis.x` / `axis.y` / `axis.z` / `axis.a` | `#e03c3c` / `#1ea178` / `#5291cd` / `#6d64d0` | Axis letters, jog buttons |
| `action.unlock` | `#f59e0b` | Unlock |
| `action.stop` | `#c62222` | E-STOP, Stop |
| `laser` | `#5c52cb` | Laser-mode tint (purple-500) |

- Radii: buttons use `radius-md` (6px), jog buttons `radius-xl` (12px). No pill buttons.
- Fonts: IBM Plex Sans and IBM Plex Mono. Check whether they're already bundled; if not, add them to the pendant `index.html`. *(Implemented via `@fontsource`, see D4.)*

---

## 3. CarveMode: which layout to show

Create `useCarveMode()`. It returns one of the modes below, computed from existing selectors: `connection.isConnected`, `controller.workflow.state`, `controller.state.status.activeState`, `controller.state.status.alarmCode`, `file.fileLoaded`, and the tool-change wizard state (§8).

Evaluate in this order; the first match wins:

| # | Mode | Condition | Mockup panel |
|---|---|---|---|
| 1 | `disconnected` | `!isConnected` | *not mocked*. Use the `setup` layout with every action disabled (existing gating already does this). |
| 2 | `toolchange` | Tool-change wizard visible, or `activeState === 'Tool'` | 12 |
| 3 | `alarm` | `activeState === 'Alarm'` | 08 (soft limit), 09 (homing required: `alarmCode` is 11 or `'Homing'`) |
| 4 | `holdJob` | `workflow === PAUSED`, or (`workflow === RUNNING` and `activeState` is `Hold` or `Door`) | 11 |
| 5 | `running` | `workflow === RUNNING` | 07 |
| 6 | `holdIdle` | `activeState` is `Hold` or `Door` | 10 |
| 7 | `setup` | otherwise | 01–06 |

What each region shows per mode:

| Region | setup | running | holdJob | alarm | holdIdle | toolchange |
|---|---|---|---|---|---|---|
| Left column | SetupTabs | RunLeft | RunLeft | LockedNotice (red) | LockedNotice (amber, "Held") | TcLeft |
| Right column | JogArea | RunRight | RunRight (paused) | AlarmHelperCard | HoldCard | TcRight |
| Viz job controls | Start+Stop (only if file loaded) | Pause+Stop | Resume+Stop | hidden | hidden | hidden |
| File chip | `Load file` or name with ✕ | name, no ✕ | name, no ✕ | hidden | hidden | name, no ✕ |
| Viz state ring | none | green | amber | red | amber | purple |
| TopBar Home | enabled* | disabled | disabled | enabled* | disabled | disabled |

\* Home uses the existing DROCard gating, unchanged (§4).

**Acceptance:** write a unit test for every row of the first table, plus `Door` and `Alarm`-during-a-run (alarm wins).

---

## 4. Top bar (`CarveTopBar`): every panel

Replaces `PendantTopBar` in the new layout. The old file stays as is.

### StatusBadge (left)
- 178×32 normally, **206** px wide in `toolchange` so "Tool change" fits.
- Left segment: connection icon + port name. Right segment: state tile, state word, optional sub-line, and a chevron.

**State word and colour**
- Reuse the label map in `PendantTopBar.tsx`: Idle, Running→**Run**, Jogging, Check, Homing, Hold, Door, Alarm, Tool Change.
- Colour by mode: idle/run/hold/alarm/tool tokens.
- Port: `connection.port`.

**Sub-line**
- alarm → `Alarm {code} · {registry title}`, for example "Alarm 2 · Soft limit". Get the title from `normalizeHelperMessage({kind:'alarm', code}, ctx)` (`app/features/Helper/messages/normalize.ts`).
- homing alarm → "Homing required".
- toolchange → `T{current} → T{next}` from the tool-change context.

**Animation**
- Pulse in run and alarm. Reuse the `badge-animate-run` and `badge-animate-alarm` classes from `src/pendant/src/index.css`.
- Respect `prefers-reduced-motion`.

**Tap / chevron**
- Opens the **existing `ConnectionWidget` flows**: the connected info card, hold-to-disconnect, and the port dropdown.
- Extract the dropdown and info card from `ConnectionWidget.tsx` into child components that can be reused, with logic unchanged. Render them anchored under the badge.

**Disconnected**
- Not mocked. Render `ConnectionWidget`'s existing pill ("Connect to CNC" / "Connecting…" / "Connection failed") in the badge slot, at badge size.

### Clock (centre)
- 24-hour `HH:MM:SS`, mono. Move the clock logic out of `InfoStrip.tsx` into a shared hook.

### Home and E-STOP (right)
- **Home:** `homeMachine` (`app/features/DRO/utils/DRO`). Copy the gating from `DROCard.tsx` exactly: enabled when connected, not running, Idle/Jog and `$22 > 0`, *or* during a homing alarm. When disabled, render it as an outline.
- **E-STOP:** the existing `PendantTopBar` handler, `cancelJog(activeState, controllerType)`, unchanged.
- The top bar no longer has an Unlock button. Unlock moves to the right-column cards (§7).
- Logo hold-to-quit is parked (§10).

---

## 5. Visualizer stage (`VizStage`): every panel

- Takes the full width and 42% of the screen height.
- Reuse `components/Visualizer.tsx` **as-is**: SVG canvas, `file:load` subscription, bit position while running.
- Keep `FileLoadingOverlay` exactly as it behaves today.

### 5.1 FileChip (top-left)
- **No file:** blue "LOAD FILE" chip. Tapping it calls the same handler as the File tab CTA (§6.1.1) and switches the left tab to **File**.
- **Loaded, `setup` mode:** filename (truncated, max ~140px) and a ✕. ✕ calls the existing BottomDrawer `handleUnload`. Extract it unchanged into `useFileActions()`; see §11-Q3.
- **running / holdJob / toolchange:** filename only, no ✕.

### 5.2 InfoGlass (top-right)
A translucent glass chip that reuses the selectors in `InfoStrip.tsx`.
- Fields shown: **units** (mm/in), **dist** (abs/inc), **move** (motion mode). The mockup shows "feed" for G1; derive it from `controller.modal.motion`.
- **Pins:** render **only asserted pins**, as a letter over a green square, after a divider. If no pins are asserted, render no pin segment at all.
  - Use `status.pinState` and the same pin keys as `InfoStrip` (X, Y, Z, A, P, D, H…).
  - Don't port InfoStrip's "always show all pins" TEMP override.
- Dropped fields (wcs, plane, feed mode, coolant, spindle, tool) are parked (§10).

### 5.3 VizJobControls (bottom-left)
- Two equal 74×38 buttons: a **job slot** and **Stop**.
  - The job slot is `ControlButton` (`app/features/JobControl/ControlButton.tsx`) with `type=PAUSE` when running, otherwise `type=START`. START already sends `gcode:resume` when paused.
  - Label the slot **Start**, **Pause** or **Resume** to match the mode.
- Props are the same as today's `JobControls.tsx`, including the stubbed `validateATC`. Keep the stub.
- `ControlButton` has no styling prop. Add an optional `variant?: 'default' | 'pendantCompact'` and an optional `labelOverride?: string`. The defaults must leave desktop unchanged.
- Colours:
  - Start/Resume: `state.run` with a play icon.
  - Pause: `state.pause` with two bars.
  - Stop: `action.stop` with an octagon.

### 5.4 State ring
- An inset box-shadow on the stage, coloured per mode (§3 table).
- G-code line colours never change with state.

---

## 6. Setup mode (panels 01–06)

### Left: `SetupTabs`
- Tabs in this order: **File · Position · Tools · Prep · Console · Macros**.
- Default tab: **File** when no file is loaded, otherwise **Position**.
- Keep every tab body mounted and hide inactive ones, as BottomDrawer does now, so state survives tab switches.
- Tab visibility:
  - **Tools** follows the existing ATC rule: `atcEnabled || NEWOPT.ATC === '1'`. When it's hidden, fall back to Position.
  - The coolant rows inside Prep follow `coolantFunctions`.
- Active tab style: `robin-500` underline with a tinted background. Robin is used only for selection, never for actions.

### Right: `JogArea`
Reuse **`JoggingCard.tsx` logic completely**: presets from `widgets.axes.jog.*`, unit conversion, short and long press, continuous jog, the rotary A→Y mapping, and `canJog` gating.
- Restyle to match the mockup:
  - Preset row (Precise / Normal / Rapid, active one filled `robin-500`).
  - 3×3 XY pad: neutral diagonal arrows, axis-coloured X/Y, and a faint, non-interactive centre crosshair.
  - A two-column Z± / A± pad underneath, 72px tall, coloured `axis.z` and `axis.a`.
- How to do it without duplicating logic: extract `JogActionButton` and the preset hook from `JoggingCard.tsx` into exported pieces, then compose them in `JogArea`. Behaviour must stay identical.

### 6.1 File tab (panels 01, 03)
Take the logic from the BottomDrawer File tab. Extract it into `useFileActions()` and `useRecentFiles()` with no behaviour change.

**6.1.1 No file loaded**
- Dashed CTA with a file icon: "No file loaded" / "Drop a G-code file here, or browse for one".
- **LOAD FILE** button calls `handleLoadClick`. In Electron that's `pickGcodeFile`; in a browser, the hidden `<input>` fallback.
- Drag-and-drop is optional. In a browser, a `drop` handler that feeds the same `applyGcodeFile` path is enough.
- "Recent files" list:
  - Source: `localStorage['pendant-recent-files']`, via the existing readers. Show up to 5.
  - Each row shows the name and "{size} · {Today | Yesterday | MMM d}".
  - Tapping a row calls `handleRecentLoad`, with the same Electron/`filePath` gating as today. Grey the row out when it can't load.
- Footer hint (copy from mockup).

**6.1.2 File loaded**
- **Stats grid, 2×2:**
  - Lines: `file.total`
  - Size
  - Est. time: `file.estimatedTime`
  - Loaded: `loadedAt`, formatted "Today HH:MM"
  - (BOUNDS is parked.)
- **Trace outline · RUN**
  - Reuse `app/features/JobControl/OutlineButton.tsx` logic. Mount it with a pendant variant prop, or extract its click handler.
  - Enabled only when the file is loaded and workflow and state are both Idle. That's the desktop `JobControl/index.tsx` rule.
- **Editor · OPEN:** opens the desktop `GcodeEditor` (`app/features/Visualizer/GcodeEditor`) in a full-height sheet over the columns, the same component the drawer embeds today. `onClose` dismisses the sheet.
- **Start from line** (−/value/+ stepper): **NEW UI over existing logic.** The stepper holds a line number (1…`file.total`). See §11-Q1 for how it starts. Default implementation:
  - Tapping the value opens the desktop `StartFromLine` modal (`app/features/JobControl/StartFromLine.tsx`), prefilled with that line.
  - The modal's own `gcode:start` call does the work.
  - Gating is the same as Outline.

### 6.2 Position tab (panels 02)
- **Manual / Probe** segmented toggle.

**Manual**
- **Axis rows X, Y, Z, A:**
  - Coloured left border.
  - The axis letter is a button with a go-to icon that calls `gotoZero(axis)`.
  - Value: work position, 3 decimals.
  - **ZERO** calls `zeroWCS(axis, 0)`.
  - Logic and gating copied from `DROCard.tsx`. A is always shown, as in DROCard today.
- **Go To XY** calls `goXYAxes`. **Zero All** (primary blue) calls `zeroAllAxes`.
- **"Rapid to corner"** pad:
  - Five hold-to-confirm targets: BL, BR, FL, FR, CTR.
  - Reuse MovePanel's Corner Select logic (`MovePanel.tsx`): the 700 ms hold with progress ring, the `getMovementGCode(...)` command, and `canAct && hasHomed` gating. Extract it into `useCornerRapid()`.
  - Hint text: "Hold a corner to rapid there, home required first".

**Probe**
- Render the existing **`ProbePanel` with `mode="expanded"`**, plus its `ProbeWizardDrawer`, unchanged. The Probe design is not in the mockups, so reuse it whole.

### 6.3 Tools tab (panel 04)
Built from `ATCPanel.tsx` and its desktop parts, inside `ToolchangeProvider`.

- **Current tool card:**
  - Wrench icon, T-number or "Empty".
  - Status pill: probed (green), unprobed (amber), empty (neutral).
  - Z offset, and a **PROBE** action.
  - Use the data and `probeTool` handler from `app/features/ATC/components/CurrentToolInfo.tsx`; restyle only. Dim PROBE when there's no tool.
- **Tools** square button: same handler as today. Sends `$#` and opens `ToolTable`.
- **Load / Unload:** the existing `LongPressButton` behaviour, unchanged.
  - Load: tap = load mode, long-press = manual mode, opens `LoadToolPopover`.
  - Unload: tap = `unloadTool()`, long-press = `releaseToolFromSpindle()`.
- **Tool timeline:**
  - Data comes from the existing `file:toolchanges` subscription and the active-tool tracking in `ATCPanel.tsx`.
  - Each row: colour bar and index (colour from `getToolpathColor`), T-number, probe-status pill, line range.
  - Keep the per-item remap button, styled as a small icon on the row.
- When ATC isn't available, render `ATCUnavailable` as today.

### 6.4 Prep tab (panels 05, 06)
**Power card**
- **Label and icon:** "Spindle" when `$32 == 0`, "Laser" when `$32 == 1`.
- **Readout:** spindle shows `S{rpm}`; laser shows `S{value} · {power%}`. Source: live `status.spindle`, falling back to the SpindlePanel speed or power value.
- **Spindle/laser selector:** SpindlePanel's grblHAL `react-select` with the same handler (`M104 Q{id}` + `$spindlesh`). Hide it when there's only one spindle, same as today.
- **Swap icon:** SpindlePanel `handleModeToggle`, unchanged. It's the full `$32` toggle sequence, including the laser offset and `$30`/`$31` swap.
- **Direction toggle:**
  - Spindle: **CW / CCW / Off**, mapped to the existing Forward (M3) / Reverse (M4) / Stop (M5) handlers.
  - Laser: **On / Off**, mapped to Laser On / Off.
  - The active segment comes from `controller.modal.spindle`.
- **Laser mode styling:** the whole card takes a `laser` purple tint (border, background, label, readout, selector, swap icon).

**Coolant row** (only when `coolantFunctions` is on)
- Spindle mode: independent **Mist** and **Flood** chips.
  - Turning one on uses `startMist` / `startFlood`.
  - Turning one off uses `stopCoolant()` (M9), then re-sends the other if it was still on.
  - Active state comes from `modal.coolant`, as `CoolantPanel` does now.
- Laser mode: one **Air assist** chip (see §11-Q4).

**Overrides**
- Two `IsoFader`s side by side: Feed, plus Spindle (or **Power** in laser mode).
- The spindle fader appears only when `spindleFunctions` is on, as today.
- No Rapid override here.

**IsoFader** (new presentational component, logic from `FeedOverrideWrapper.tsx`)
- Visual: "Feed & spindle override" variant A, ISO fader, scaled to a 164px card. It's the one element drawn at full fidelity (gradients, shadows), so copy the mockup's `.ovr-*` CSS faithfully.
- Layout: header chip (F or S) with title and range, then an 11-segment gauge (dim, filled, current), a recessed channel with a centre hairline, and a draggable cap with a grip.
- Under the fader: the big % readout, a sub-line (`F{live} {units}/min`, `{rpm} RPM` or "Laser power"), and a **Reset** button that sets 100%.
- Colours stay with the override, never the machine state: Feed `blue-500`, Spindle `state.run`, Power `laser`.
- Behaviour copied from `FeedOverrideWrapper`:
  - Step 10.
  - Range from `OVERRIDE_VALUE_RANGES` (20–200). Don't use the mockup's 10–200 / 0–200; see §11.
  - Debounce 750 ms for `feedOverride` and 1000 ms for `spindleOverride`.
  - Re-sync from `status.ov` after 1 s.
  - Disabled when not connected.
- Vertical drag, with tap-on-track to jump. Pointer events only, so it works on touch.

### 6.5 Console tab
- Not designed yet; the tab name is reserved. Render the existing **`ConsolePanel`** (input, Send, Clear) at full height, unchanged. *(See D2: on this branch that is the desktop `Console`.)*

### 6.6 Macros tab
- Not designed yet; the tab name is reserved. Render the existing **`MacrosPanel` with `mode="expanded"`**, unchanged: Add, Import, Export, the grid, run, and the Edit/Duplicate/Delete menu.

---

## 7. Running and Hold-mid-job (panels 07, 11)

### Left: `RunLeft` (identical in both modes)
- "Overrides · live" header.
- Feed and Spindle/Power `IsoFader`s, same component and logic as §6.4.
- **Rapid** row: three flat preset buttons, **25% / 50% / 100%**. **NEW LOGIC (UI only):**
  - Sends `controller.command('rapidOverride', 25 | 50 | 100)`. The server already handles this in `GrblController.js` around line 2239, with the grblHAL equivalent.
  - The active button comes from `status.ov[1]`. Default 100.
- No job log on this side.

### Right: `RunRight`
**Progress block, pinned to the top**
- "Lines sent `{received} / {total}`". Compute the total the way `ProgressAreaWrapper.tsx` does.
- A 7px bar: green while running, `state.hold` when paused.
- Running: `Elapsed hh:mm:ss` and `Remaining ~hh:mm:ss`. Paused: `Paused hh:mm:ss`. Use the same `sender.status` fields desktop `ProgressArea.tsx` uses.
- Current line: the most recent sent G-code line, mono, in brand colour.
- Keep the completion flash and reset behaviour from `ProgressAreaWrapper`.

**`ReadOnlyConsole`**
- Desktop `ConsoleToolbar` (filters All / G-code / Responses / System / Faults, plus Copy and Clear) and `ConsoleList` from `app/features/Console`.
- **No `ConsoleInput`.**
- Data:
  - Prefer `useConsoleMessages()`. That requires `startConsoleIngest()`, which the pendant doesn't call today; start it once in `CarveScreen`.
  - Keep the existing redux `console.history` capture in place for the Setup Console tab.
  - If the two conflict, adapt `console.history` into `ConsoleList`'s message shape with `classifyControllerRead/Write` instead.
  - *(See D2: on this branch `useConsoleMessages()` starts ingest itself and `console.history` is gone.)*
- Highlight the current line's row.
- Hold system lines (`[MSG:Hold:0]` etc.) show up naturally from controller output. **Do not inject** the mockup's illustrative "[MSG] Jog, zero and probe stay locked…" rows.

**Panel 07 vs 11 differences**
- Job slot reads Pause or Resume.
- Badge reads Run or Hold.
- Bar colour and progress meta differ as described above.
- Ring colour.

---

## 8. Locked layouts and tool change

### 8.1 Alarm (panels 08, 09)
**Left: `LockedNotice`**
- Red lock icon, "Locked", and a one-sentence reason.
- Soft limit: "The last jog crossed a soft limit. File, Position, Tools, Prep, Console, Macros and jogging stay hidden until the alarm clears."
- Homing: "Homing is required before any motion. …"
- For other codes, use the registry description's first sentence.

**Right: `AlarmHelperCard`**
- Rendered **inline, not as a popup**.
- `normalizeHelperMessage({kind:'alarm', code: alarmCode}, ctx)` from `app/features/Helper/messages/normalize.ts`.
- Built from the desktop message components in `app/features/Helper/components/message/`:
  - `MessageHeader` (with `SeverityBadge`): eyebrow plus title
  - description paragraph
  - `StepsList` ("Try this")
  - `ResourceBlock variant="row"`: real QR code plus "Open guide ↗"
- Don't mount `HelperWrapper` for this; the inline card replaces the popup on the pendant.

**Actions at the bottom of the card**
- Not the homing alarm: **Unlock ($X)**, styled primary amber.
  - Runs the **existing `PendantTopBar` unlock handler** unchanged: alarms 1/2/10/14/17 send `reset:limit`; others send `unlock`. Extract it into `useUnlock()`.
  - The label stays "Unlock ($X)" even though alarm 2 sends `reset:limit` (see §11).
- Homing alarm (`alarmCode` 11 or `'Homing'`): **Home ($H)**, solid blue, sends `homing`, the same branch of the same handler.
- Both: **Reset**, secondary. Sends `reset:soft` on grblHAL and `reset` otherwise, the same branch `cancelJog` uses for non-idle states.

Pins: the homing alarm shows any asserted X/Y pins through the normal InfoGlass rule. Never fake pins.

### 8.2 Hold, no job (panel 10)
- **Left:** `LockedNotice` in amber: lock icon, "Held", reason text.
- **Right:** `HoldCard`
  - Title "Hold" and one line of copy.
  - **Resume (~)** sends `cyclestart` (the existing Hold branch of `useUnlock`).
  - **Reset**, as in §8.1.

### 8.3 Tool change wizard (panel 12)
**Prerequisite (NEW WIRING).** The pendant doesn't mount `WizardProvider` and doesn't subscribe to `wizard:load` today.
- Wrap `CarveScreen` in `WizardProvider` (`app/features/Helper/context.tsx`).
- Add the `wizard:load` subscription and `load(instructions, title, meta)` call, copied from `app/features/Helper/HelperWrapper.tsx`. Don't render the desktop `Wizard` modal or `HelperInfo` popup.
- Check that this doesn't double up with the ATCI dialogs in `pendant-sagas.ts`; those stay.

**Left: `TcLeft`**
- Step list built from `useWizardContext()` steps: done (green ✓), active (purple), upcoming (grey). Reuse desktop `Stepper` if it renders acceptably in about 360px; otherwise re-skin it with the same context.
- Footer: **Back**, substep dots and **Next**, using the same handlers and disable rules as desktop `Controls.tsx`.

**Right: `TcRight`**
- Breadcrumb (active step title) and a **Guide / Jog** segmented toggle.
  - **Guide:** desktop `Instructions` content, or the same substep data re-skinned. Show a tool banner "Install new tool / T{n}" in `state.tool` purple, then the description, then the substep actions as rows with small bordered buttons (RUN, DONE). Each wires to the substep's existing action or `completeSubStep`.
  - **Jog:** render `JogArea` (§6). Allowed here because jog gating already follows machine state.

**Elsewhere on screen**
- Badge: "Tool change", 206px wide, sub-line `T{from} → T{to}`.
- Ring: purple. Home disabled. No job controls. File chip read-only.

---

## 9. Build order and acceptance

| Phase | Deliverable | Done when |
|---|---|---|
| 0 | Tokens (§2), `legacyCarve` flag, `carve/` folder, `CarveScreen` skeleton | The flag toggles old and new screens; type-check and lint pass |
| 1 | `useCarveMode` and tests (§3) | All mode tests pass |
| 2 | Top bar (§4) | Badge correct in all 6 modes; connection menu works; Home and E-STOP gating matches old behaviour |
| 3 | VizStage (§5) | Chip, info glass, job slot and ring correct per mode; desktop `ControlButton` unchanged (visual check) |
| 4 | Setup tabs and JogArea (§6.1–6.6) | Each tab reproduces its old drawer behaviour; Outline, Editor and Start-from-line work |
| 5 | IsoFader and RapidPresets (§6.4, §7) | Overrides send the same commands as before; rapid sends `rapidOverride` and reflects `status.ov[1]` |
| 6 | Running and Hold-job (§7) | Progress matches the old `ProgressAreaWrapper`; console filters, copy and clear work; no input box |
| 7 | Alarm and Hold-idle (§8.1–8.2) | Registry copy and QR render for alarm 2 and the homing alarm; Unlock, Home, Resume and Reset send the same commands as the old top bar |
| 8 | Tool change (§8.3) | An M6 job opens the inline wizard; Back/Next and substep actions advance; the Jog toggle jogs |
| 9 | Parked tally (§10) and discrepancy log (§11) updated | Every old feature is accounted for |

**Global checks**
- With `legacyCarve=true` the old screen works exactly as before.
- No desktop file changes other than additive, defaulted props.
- No new hard-coded hex outside IsoFader.
- Works at 810×1080 portrait with no scroll in the main layout. Internal lists may scroll.

---

## 10. Parked features: keep the code, tally for later

These exist in the current pendant but **are not in the mockups**.
- **Do not delete or modify these files.**
- Each stays reachable through `legacyCarve=true`.
- Add a `status` column update when the tally is reviewed.

| # | Feature | Where it lives now | Notes |
|---|---|---|---|
| P1 | Logo hold-to-quit (Electron) | `PendantTopBar.tsx` | No logo in new top bar |
| P2 | Top-bar Unlock button | `PendantTopBar.tsx` | Logic reused in `useUnlock` (§8) |
| P3 | Desktop-parity unlock gaps (alarm 6–9 confirm, ATC homing dialog, `populateConfig`) | `features/UnlockButton`, `MachineStatus` (desktop) | Pre-existing gap; not in scope |
| P4 | InfoStrip fields: wcs, plane, feed mode, coolant, spindle/laser pulse, tool T{n} | `InfoStrip.tsx` | Only units/dist/move are kept |
| P5 | InfoStrip "all pins always shown" | `InfoStrip.tsx` | Replaced by "asserted only" |
| P6 | DRO WORK/MACHINE toggle | `DROCard.tsx` | Position tab shows work only |
| P7 | **WCS selector G54–G59** | `WorkspaceSelector.tsx` | Not in mockup; flag as high-priority to re-home |
| P8 | Visualizer legend (Cut/Rapid/Bounds) | `VisualizerCard.tsx` | |
| P9 | Bottom drawer modes (closed/minimal/expanded, double-tap header) | `BottomDrawer.tsx` | Replaced by tabs |
| P10 | File stat BOUNDS | `BottomDrawer.tsx` | |
| P11 | Move: **Park** button, **Home All** quick row | `MovePanel.tsx` | Home moves to top bar |
| P12 | Move: **Go To Position** (ABS/INC/MACHINE, step sizes, per-axis stepper) | `MovePanel.tsx` | Only Go To XY remains |
| P13 | Spindle expanded: Speed slider, laser Power slider, **laser Test** and Duration | `SpindlePanel.tsx` | Power card has no sliders |
| P14 | Coolant explicit **Off** button | `CoolantPanel.tsx` | Chips toggle instead |
| P15 | Setup-mode Feed/Spindle override **sliders under the visualizer** | `FeedOverrideWrapper.tsx` | Replaced by IsoFader (logic reused) |
| P16 | Progress card under visualizer (outside a job) | `ProgressAreaWrapper.tsx` | Logic reused in RunRight |
| P17 | Light theme | `index.css` light variables | New screens are designed dark-only |
| P18 | Unused files: `MachineStatus.tsx`, `ConnectionBar.tsx`, `PendantDRO.tsx`, `ProbeConnectivityBadge.tsx`, `PlaceholderView.tsx` | `src/pendant/src` | Already unused |

Features the mockup marks as **reserved, reused whole**: Console tab (`ConsolePanel`), Macros tab (`MacrosPanel`), Position › Probe (`ProbePanel` + wizard). Tools and Config bottom-nav views are unchanged.

---

## 11. Discrepancies and open questions

The agent should log anything new it finds here instead of choosing silently.

| # | Item | Default until answered |
|---|---|---|
| Q1 | Start-from-line: should the stepper drive the viz **Start** button directly, or open the desktop modal? | Open the `StartFromLine` modal, prefilled |
| Q2 | Mockup override ranges (Feed 10–200, Power 0–200) differ from code (`OVERRIDE_VALUE_RANGES` 20–200) | Use the code values |
| Q3 | The pendant's file **Close** doesn't send `gcode:unload` or publish `unload:file` (desktop does) | Keep the pendant behaviour; flag it as a bug |
| Q4 | Air assist: which coolant command (M7 or M8)? | M7 (Mist), per mockup copy |
| Q5 | "Unlock ($X)" label vs `reset:limit` being sent for alarms 1/2/10/14/17 | Keep the logic; label as mocked |
| Q6 | Disconnected state not mocked | Existing ConnectionWidget pill in the badge slot; setup layout disabled |
| Q7 | Tool-change install banner: desktop is green, mockup is purple | Purple (`state.tool`) |
| Q8 | `MacrosPanel` gating is weaker than desktop (connection only) | Unchanged; flag it |
| Q9 | Probe status of tools in the timeline needs ATC data. What should a non-ATC M6 job (manual tool change) show? | Timeline hidden when ATC is unavailable, as today |

### Branch deltas (`features/android_v2` vs. the `5b37128` baseline)

| # | Item | Resolution |
|---|---|---|
| D1 | The Helper message system (`Helper/messages/*`, `Helper/components/message/*`) didn't exist on this branch | Ported additively from `5b37128`, together with `tests/jest/helperMessages.test.ts`. That branch's `HelperInfo`, `HelperWrapper`, `controllerSagas` and store changes were **not** ported, because they change desktop behaviour. 4 tests in the ported suite already fail on `5b37128`: the registry overrides alarm titles, e.g. "Homing fail — limit switch not found", and the test expects the bare constant text. Left as is. |
| D2 | `ConsolePanel` and the redux `console.history` were removed in `181e5ed73`. The pendant drawer already mounts the desktop `app/features/Console`, and `useConsoleMessages()` calls `startConsoleIngest()` itself | The Console tab mounts the desktop `Console`. `ReadOnlyConsole` = `ConsoleToolbar` + `ConsoleList` + `useConsoleMessages`. No separate ingest start. |
| D3 | The workspace dark-mode setting can turn `<html class="dark">` off | The `CarveScreen` root carries `class="dark" data-dark-theme="workshop"` so shared components' `dark:` variants resolve. Portals escape that root (see open items). |
| D4 | IBM Plex isn't bundled, and the pendant can run offline on a LAN | `@fontsource/ibm-plex-sans` and `@fontsource/ibm-plex-mono` are imported in `entry-pendant.tsx` and mapped to `font-sans`/`font-mono` in the pendant tailwind config only |
| D5 | Depth gauge: in the current pendant but in neither the mockup nor the spec | Kept by product decision. It is mounted in `VizStage` on the right edge below InfoGlass, with its hex values swapped for token classes |
| D6 | **Tool-change wizard never loads on the pendant.** `wizard:load` is published by the desktop `controllerSagas` `gcode:toolChange` listener. The pendant runs its own saga (`pendant-sagas.ts`) that has no such listener. Porting it would run `instructions.onStart()` → `wizard:start` on every connected client, so it would fire twice while desktop is also open | `WizardProvider` + `WizardBridge` (the `wizard:load` half of `HelperWrapper`) are wired and inert. `toolchange` mode still shows on `activeState === 'Tool'`, with a "follow the steps on gSender" fallback plus the Jog view. **Open: should the pendant own tool changes, and if so how is it deduped against desktop?** |
| D7 | Tools tab (ATC) and Spindle power card restyle | Prep's power card is restyled through a new optional `SpindlePanel` `renderCard` prop, so the panel's own handlers are used unchanged. The Tools tab mounts `ATCPanel mode="expanded"` whole for now. The mockup's condensed ATC layout (current-tool card, timeline rows) is still to do |
| D8 | Trace outline: the non-lite path publishes `outline:start`, and on the pendant nothing subscribes to it (the GcodeViewer/FileInformation handlers are desktop-only) | `OutlineButton`'s handler is exported as `runOutline(posthog, { liteMode })`, and desktop still calls it with the stored setting. The pendant passes `liteMode: true` (outline worker + `file.bbox`) |
| D9 | "Highlight the current line's row" in `ReadOnlyConsole`: desktop `ConsoleList` has no highlight API | Not done, to avoid a desktop change. The current line is shown in the pinned progress block instead |
| D10 | Start from line: the desktop `StartFromLine` opens its modal from its own button only | Added optional `renderTrigger` + `initialStartLine` props (defaults unchanged). The stepper value is the trigger, keyed so the modal opens prefilled |
| D11 | Paused timer: `sender.status` has no paused-duration field | `RunRight` counts locally from when the workflow entered `paused` |
| D12 | Recent files: the drawer enabled Load whenever `filePath` was set, but `handleRecentLoad` only loads in Electron | Rows grey out unless `filePath && isElectron()` (`canLoadRecent`) |
| D13 | Spindle selector: the drawer always renders it, dimmed with no spindles | The power card hides it when ≤1 enabled spindle and widens the swap button into "Switch to laser/spindle" |
| D14 | Override fader readout vs. grid | The cap snaps to the 10 % grid (step 10, `OVERRIDE_VALUE_RANGES`), and the % readout shows the real `status.ov` value (e.g. 85 %) |
| D15 | Bottom nav | Scoped dark, the same as the top bar and carve body, in the new layout only. The Tools and Config views still follow the workspace dark setting |
| D16 | `MessageHeader` uses Radix `Dialog.Title`/`Close`, so it can't render outside a Dialog | `AlarmHelperCard` builds its header from `SeverityBadge` + `getEyebrow`. `StepsList` and `ResourceBlock variant="row"` are used as-is |
| D17 | Pre-existing failing test on this branch: `JogWheel continuous jog release › treats a press shorter than the threshold as a single step jog` | Unrelated to this work (it imports nothing changed here) |
