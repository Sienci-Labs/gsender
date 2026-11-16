# Layout → Figma

Turns the live layout of gSender (or any web/Electron app) into editable Figma
layers: frames with fills, borders, radii and shadows, real text layers, SVG
icons as vectors, images, Tailwind colors as Figma variables, and flex
containers as auto layout.

It captures three layouts (desktop, pendant, and the pendant as the Android
app shows it), and it can capture Storybook instead of the running app, which
turns every story and control state into a Figma component variant.

| Part | What it does |
| --- | --- |
| `capture/` | Reads the rendered DOM (computed styles + measured boxes) and writes a `.figma-layout.json` file. |
| `figma-plugin/` | A Figma plugin, **Layout Importer**, that builds those files into frames and component sets. |
| `launcher/` | A local web page for running all of it without the flags (`yarn figma:ui`). |
| `shared/` | Logic used by both Node and the plugin: comparing captures, matching layers for linked prototypes. |

None of it needs `npm install` beyond the repo's own. The capture scripts use
Node 22+ and the Chrome already on your machine.

| I want to… | Run |
| --- | --- |
| Pick options on a page instead of the command line | `yarn figma:ui` |
| Capture the main screen | `yarn figma` (`--pendant`, `--android`) |
| Capture whatever state I put the app in | `yarn figma:live` |
| Capture every story and its control states | `yarn figma:storybook` |
| Import only what changed since an earlier capture | `yarn figma:diff old.json new.json`, or **Only import differences** in the plugin |
| Make imported screens follow my prototype | **Prototype** in the plugin |

## Launcher

```bash
yarn figma:ui
```

Opens `http://localhost:7780`: choose what to capture (screens, live, or
Storybook), the layout, theme, size, which tabs and menus to break out, and
the machine to connect to, then **Start**. The page shows the tool's output
as it runs, has **Stop**, and in live mode a **Capture now** button.

Below that it lists the captures in `./figma-captures/`. Pick one as
**Baseline** and one to **Compare**, and **Save differences only** writes a
`….changes.figma-layout.json` holding just what differs (see
[Only import differences](#only-import-differences)).

While the launcher is open it also serves the captures folder to the Figma
plugin's Live panel, in every mode, so new captures show up in Figma by
themselves. It listens on this machine only, and only ever starts
`start.mjs` with arguments built from the page's options.

## Quick start

```bash
yarn figma
```

This starts the gSender backend and Vite renderer if they aren't already
running, connects gSender to the grblHALTwin digital twin at `127.0.0.1:23`
(so machine-only controls, DROs and firmware settings show up), captures the
main screen into `./figma-captures/`, stops the servers
it started, and prints the steps for importing into Figma. A cold start
builds first and can take a few minutes; server logs go to a temp folder
whose path is printed.

It takes every capture option below, plus:

| Option | |
| --- | --- |
| `--keep` | Leave the servers it started running afterwards (faster next time). |
| `--open` | Open the output folder when done. |
| `--machine host:port` | Connect to a different machine over Ethernet first. |
| `--no-machine` | Capture disconnected. |
| `--header-states` | Also break out the header's menus: connection, machine info, notifications (see [Tabs, menus and popovers](#tabs-menus-and-popovers)). |
| `--all-states` | Also break out the header's and sidebar's menus (see [Tabs, menus and popovers](#tabs-menus-and-popovers)). |
| `--pendant` | Capture the pendant (tablet) UI instead of the desktop one (see [Pendant and Android](#pendant-and-android)). |
| `--android` | Capture the pendant UI the way the Android app shows it. |
| `--storybook` | Capture Storybook instead of the app (see [Storybook](#storybook)). |

If nothing answers at the machine address, it says so and captures
disconnected. If the backend is already connected to a machine (say you
connected by hand), that connection is used as-is. The connection step uses
[`presets/gsender-connect.js`](presets/gsender-connect.js) through the CLI's
`--setup` option, so it only works against the Vite dev server.

```bash
yarn figma --theme both --open "http://localhost:5173/#/" "http://localhost:5173/#/configuration"
```

## Capture on demand (live mode)

```bash
yarn figma:live
```

This starts the servers like `yarn figma`, then opens gSender in its own
Chrome window and leaves it open. It doesn't connect to a machine; use the
app's Connect menu yourself (or pass `--machine 127.0.0.1:23` to connect to the
twin automatically). Click around and get the UI into any state you like
(connect, open a dialog, load a file, jog the machine), then
capture what's on screen with any of:

- **⌥⇧F** (Alt+Shift+F) in the gSender window
- the **◧ Capture** button in the window's bottom-right corner (it isn't
  included in captures)
- **Enter** in the terminal

While it captures, you'll see the window click through each tab and open
each menu for a moment (the button shows progress), then return to where you
were. Pass `--no-states` for an instant capture of just what's on screen.
You can switch to Figma while it runs: the window keeps rendering when
covered. A minimized window still works but captures more slowly.

Each capture is saved to `./figma-captures/` with a timestamp. With the Figma
plugin open, it shows up in the plugin's **Live** panel within a couple of
seconds. With **Import new captures automatically** on, it lands on the canvas
by itself. Close the window or press Ctrl+C to stop; servers the script
started stop with it.

To capture the Electron app on demand instead, start it with remote debugging
(see below) and attach:

```bash
yarn figma:live --connect 9222
```

The plugin finds live mode at `http://localhost:7777`, which is allowed in its
manifest as a development-only domain.

## 1. Capture

If you'd rather manage the servers yourself, start gSender the usual way ([dev setup](https://resources.sienci.com/view/gs-compile/)):

```bash
yarn dev
```

```bash
yarn vite:dev
```

Then capture one or more screens. gSender uses hash routes:

```bash
yarn figma:capture "http://localhost:5173/#/" "http://localhost:5173/#/configuration"
```

Files land in `./figma-captures/` (git-ignored), named
`<route>-<width>x<height>-<theme>.figma-layout.json`.

Useful options (`yarn figma:capture --help` lists them all):

| Option | |
| --- | --- |
| `--theme light\|dark\|both` | Toggle the `dark` class on `<html>` before capturing. `both` gives one file per theme. |
| `--layout desktop\|pendant\|android` | Which layout this is; sets the viewport and default URL (`yarn figma --pendant`/`--android` pass it for you). |
| `--portrait`, `--landscape` | Turn the pendant/Android screen. |
| `-w 1280 -h 800` | Viewport size (default: the layout's, 1440×900 for desktop). |
| `--stamp` | Put the time in the file name instead of overwriting the last capture of that screen, so the two can be compared. |
| `--setup "<js>"` | Run JS on every page before `--eval` (this is how `yarn figma` connects the machine). |
| `--eval "<js>"` | Run JS before capturing, e.g. open a dialog: `--eval "document.querySelector('[data-testid=load-file]').click()"`. |
| `--wait-for "<css>"` | Wait for a selector instead of waiting for the DOM to settle. |
| `--full-page` | Capture the full scroll height of document-style pages. |
| `--no-states` | Skip clicking through tabs and opening menus (see [Tabs, menus and popovers](#tabs-menus-and-popovers)). Faster. |
| `--states-in "<css>"` | Only break out tabs/menus inside elements matching this selector, e.g. `main`. |
| `--states-skip "<css>"` | Don't break out tabs/menus inside elements matching this selector, e.g. `header`. |
| `--connect 9222` | Capture a running Chrome/Electron window as-is (see below). |

### Capturing the Electron app or a specific UI state

To capture exactly what's on screen (a connected machine, an open modal, a
loaded file), start the Electron dev app with remote debugging and attach to it:

```bash
REMOTE_DEBUGGING_PORT=9222 yarn dev:electron
```

An installed build accepts the same flag, e.g.
`/Applications/gSender.app/Contents/MacOS/gSender --remote-debugging-port=9222`.
Get the UI into the state you want, then:

```bash
yarn figma:capture --connect 9222
```

Use `--target <text>` to pick a window by URL or title if there is more than one.

### Pendant and Android

`--pendant` captures the pendant UI (`src/pendant`), the tablet app that is
also what the desktop app shows with "use pendant view as default UI". It
works in batch and live mode:

```bash
yarn figma --pendant
yarn figma:live --pendant
```

It starts the pendant's dev server (`yarn vite:dev:pendant`, port 5174)
instead of the desktop renderer, next to the same backend, and opens an
800×1280 portrait window, the production pendant's size (`-w`/`-h` change
it). The pendant switches screens in-app rather than by URL, so a batch
capture records the screen it starts on; use live mode to capture the others.
Connecting to the machine works the same way. Tabs and menus are broken out
everywhere, since the pendant has no `<main>` area to limit them to.

`--android` captures the same UI as the Android app (`android/`) shows it.
That app is a WebView around the pendant, so the layout differs from the
pendant build only in what the device gives the page:

```bash
yarn figma --android
yarn figma:live --android --portrait
```

- a 1280×800 landscape tablet screen (`--portrait` turns it, `-w`/`-h`
  set another size). The Android shell leaves the WebView's wide viewport
  off, so the page's `<meta viewport width=768>` doesn't apply and the UI
  lays out to the screen, which is what this reproduces;
- touch input, and the Android WebView's user agent;
- the shell's `window.GSenderAndroid` bridge and no Electron API, so
  controls that depend on either (restart, quit, the file picker) show the
  way they do on the tablet.

It can't reproduce what only the device has: its fonts, system bar insets,
and the on-screen keyboard. To capture the real thing, attach to the
tablet's WebView instead: with a debug build connected over USB, run
`adb forward tcp:9222 localabstract:webview_devtools_remote_<pid>` (the pid
is in `adb shell cat /proc/net/unix | grep webview_devtools`), then
`yarn figma:capture --connect 9222 --layout android`.

Files and Figma frames carry the layout in their name
(`android-index-1280x800-dark…`, `… — Android 1280×800 Dark`).

## Storybook

```bash
yarn figma:storybook
```

Where a screen capture drills into tabs and menus, this drills into
component states. It starts Storybook if it isn't running (`yarn storybook`,
port 6006; no backend or machine needed), then for every component:

- renders **each story**, waits for it to finish (including its `play`
  function, so a story that opens a dialog is captured with it open), and
  records what it painted, cropped to the content;
- on the component's first story, sets **each control** to each value it
  can take and records the result. Controls that are a switch or a list of
  options count (boolean, select, radio); free-form ones (text, objects)
  don't. Component props are tried in every combination when that is 36
  states or fewer (variant × size × disabled), otherwise one at a time.
  The machine state controls every feature story gets from
  `.storybook/machine-args.js` (preset, firmware, homed, units) change one
  at a time;
- drops states that look exactly like one it already has, so a control
  that changes nothing adds nothing. Stories themselves are always kept.

The result is one file per layout,
`storybook-<layout>-<size>-<theme>.figma-layout.json`. Stories under
`src/pendant` are captured at the pendant's size and the rest at the
desktop's.

In Figma each component becomes a **component set** named after its
Storybook title (`Features/Jogging`), with a variant per state. The variant
properties are `Story` plus each control the states actually differ in, so
an instance's properties panel reads like Storybook's controls:

```
Story=Idle, machinePreset=alarm
Story=Primary, variant=outline, disabled=true
```

| Option | |
| --- | --- |
| `--stories <text>` | Only components whose title, id or file contains this. Repeatable: `--stories components/Button --stories Jogging`. |
| `--controls none\|primary\|all` | Cycle controls on no story, each component's first (default), or every story (slow). |
| `--interaction-states` | Also force hover, focus and pressed on stories that show a single button or input, as an `Interaction` property. |
| `--layout desktop\|pendant\|android\|all` | Which stories and at what size. `android` takes the pendant's stories at 1280×800 with touch emulation. Default: desktop and pendant. |
| `--theme light\|dark\|both` | Toggle the `dark` class before capturing. |
| `--max-variants <n>` | Most states per component (default 60). |
| `--stamp` | Keep earlier captures (time in the file name). |

A full run is a few hundred renders and takes several minutes. Stories that
fail to render or paint nothing are listed and skipped. To capture a
Storybook that is already running somewhere else (another port, or a
deployed one), run the capture script directly:
`node tools/figma-layout/capture/storybook.mjs --url http://localhost:6007`.

Control states are rendered by changing the story's args in place, so they
show the story after its `play` function ran, with the control changed.

### Without the CLI

Paste the contents of `capture/serialize.js` into the DevTools console of any
page (including Electron's). It downloads the JSON right away. Canvases and
other native elements may come through as grey placeholders, because only the
CLI can screenshot them.

## 2. Import into Figma

1. In the Figma **desktop app**, open or create a **Design** file. Development
   plugins can't be imported in the browser, from the file browser, or in FigJam.
2. Press **⌘/** (**Ctrl+/** on Windows) to open quick actions, type
   **Import plugin from manifest**, and choose
   `tools/figma-layout/figma-plugin/manifest.json`. You only do this once.
   The same command is under the Figma menu (top-left) → **Plugins → Development**,
   or right-click the canvas → **Plugins → Development**.
3. Run it: quick actions → **Layout Importer**, or
   right-click → **Plugins → Development → Layout Importer**.
4. Either drop in one or more `.figma-layout.json` files and click **Import
   files**, or, with `yarn figma:live` running, use the **Live** panel at the
   top.

Each capture becomes one top-level frame, placed to the right of anything
already on the page. A Storybook capture becomes a section of component sets.

Options (remembered between runs):

- **Auto layout**: flex rows/columns become auto layout frames with padding,
  gap and alignment. Each frame is checked after conversion; if Figma would
  move any child by more than 2px (margins, `flex-grow`, `space-around`, …),
  that frame stays absolutely positioned.
- **Color variables**: every color that came from a Tailwind class
  (`bg-robin-500`, `text-gray-400`, `border-input`, …) becomes a variable in a
  `Tailwind colors` collection, and the fills that used it are bound to it.
  Light and dark captures fill in separate **Light**/**Dark** modes of the same
  collection, so you can switch a frame's theme from the layer panel.
  Semi-transparent tokens (`black/50`) get variables but fills are not bound.
- **Font**: *Inter + Inconsolata* (the default) uses the design docs' fonts:
  Inter for all text, and Inconsolata for monospace text (the DRO, the
  console) so numbers line up.
  *Match the app* maps CSS fonts to installed ones (see Limitations).
- **Tabs & menus**: see below.
- **Component backgrounds** (on by default): tab panels and menus usually
  have no background of their own and show the card behind them, so their
  components look unstyled on the canvas. This gives each such component the
  colour behind it in the app, bound to its Tailwind variable when there is
  one. Turn it off to keep them transparent.
- **Flatten wrappers**: drops `<div>`s that paint nothing, and wrappers that
  only pass a single same-sized child through.

### Only import differences

To bring in just what changed since an earlier capture, give the plugin
that capture as a baseline: drop it on **Only import differences**, or click
**Compare** next to it in the Live list. Every import after that is compared
with the baseline first:

- **Screens**: the frame keeps its size but holds only the layers that
  differ, where they were, inside their original (now unpainted) parent
  frames. A component that changed comes through whole; a large container
  whose own background or size changed keeps its paint but only its changed
  children. Layers that only moved or were reordered, or were renamed
  without looking different, don't count. Tab and menu components are kept
  only if they changed.
- **Storybook**: only the states that are new or look different are
  imported; components with none are left out.

A capture identical to its baseline isn't imported at all, and the status
line says what was found. With several baselines loaded, each import is
compared with the one for the same screen, layout and theme. Remove the
baselines to import in full again.

The same comparison is available outside Figma:

```bash
yarn figma:diff figma-captures/old.figma-layout.json figma-captures/new.figma-layout.json
```

writes `new.changes.figma-layout.json`, which imports like any capture. The
launcher's **Save differences only** does this for two captures picked from
its list. Capture with `--stamp` (the launcher does by default) so the
earlier capture isn't overwritten by the next one.

Things removed since the baseline can't be shown; they are counted in the
summary.

### Linked prototypes

If the file has a prototype (screens wired together with interactions), new
imports can pick those interactions up instead of being wired by hand.

1. Open the page that holds the prototype and click **Use this page as
   master**. The choice is saved in the file.
2. Go to the page you import into. With **Link imports to the master** on,
   every screen you import is linked as it lands. **Link this page now**
   does the same for screens already there (the selected ones, or all).

Linking works in two steps, both by similarity rather than exact names:

- Each imported **screen** is paired with a master screen: the one captured
  from the same route if the master's screens are imports too, otherwise
  the one whose name shares the most words ("Configuration" pairs with
  "gSender #/configuration — 1440×900 Light").
- Within a pair, each master **layer that has an interaction** is matched to
  the imported layer most like it: by name, by its chain of parent layers
  (tolerating extra or missing wrappers), and by where it sits in the
  screen. A layer with a generic name only matches when both its place in
  the tree and its position agree.

Matched layers get a copy of the interaction (trigger, animation, overlay
settings) with its destination swapped for the corresponding screen on the
import page. Flow starting points are copied too. The status line reports
how many interactions were linked, how many layers found no match, and how
many links were dropped because their destination has no counterpart on the
page (Figma can't link across pages). If you import onto the master page
itself, links to screens that weren't re-imported keep pointing at the
master's originals.

### Tabs, menus and popovers

While capturing, the tool also records the states you'd otherwise have to
click through:

- **Tab groups** (`role="tablist"`): it clicks each tab in turn and records
  the whole tab area, including the tabs scrolled out of the strip. In Figma
  these become a component set with a **Tab** variant property (Probe,
  Macros, Coolant, …). The screen gets an instance of the tab that was
  selected, so you can switch tabs from the instance's properties. The tab
  area is the tabs plus the panel their `aria-controls` points at; tabs
  without one (the pendant's setup tabs) take the nearest box that holds the
  strip and other content.
- **Menus, popovers, dropdowns and dialogs** (anything with `aria-haspopup`,
  or a `combobox`): it opens each one with a real mouse click, records it,
  and closes it with Escape. Each becomes a `Popover / <name>` component.

`yarn figma` and `yarn figma:live` only do this inside `<main>` (the Carve
panel, or whichever settings page is open). The header's menus (connection,
machine info, notifications) look the same on every screen, so breaking them
out again each time is just clutter. Pass `--header-states` for one capture
that includes them, `--all-states` to add the sidebar's too, or
`--states-in`/`--states-skip` with your own selectors. The plain capture CLI
(`yarn figma:capture`) looks everywhere unless you pass one of those.

The components go in a **tabs & menus** section to the right of the screen.
Afterwards the page is put back the way it was: the same tab is selected and
nothing is left open. This roughly adds 10 seconds to a capture. Use
`--no-states` to skip it, or untick **Tabs & menus** in the plugin to import
a capture that has states without them.

Layers are named after the React component that rendered them (dev builds),
falling back to the tag plus `id`/`data-testid`/`aria-label`. The element's
full `className` is stored as plugin data (`classes`) on each frame.

## How it works

`serialize.js` walks the DOM and records what the browser actually painted
via `getComputedStyle` and `getBoundingClientRect`. It doesn't parse
Tailwind classes or CSS files, so CSS modules, inline styles and third-party
components come through too.

- Text nodes are measured with `Range`, so wrapped and inline text keeps its
  position. Wrapped text records where the browser broke each line, and the
  plugin breaks lines in the same places, so a font that's slightly wider in
  Figma widens the box instead of re-wrapping. Form control values and placeholders become text layers.
- `<svg>` is cloned with computed `fill`/`stroke` inlined, so `currentColor`
  and Tailwind `fill-*` classes survive.
- `<img>` and CSS background images are embedded as PNG. Linear and radial
  gradients become Figma gradients. Repeating linear gradients (the striped
  slider tracks) are tiled out into one linear gradient.
- `clip-path` shapes (polygon, inset, circle, ellipse, path), like
  MachineStatus's angled ends, become a vector shape carrying the element's
  background and border. Children aren't masked (a mask hid their text in
  auto layout frames), so anything sticking out past the shape shows.
- `position: fixed` elements (modals, toasts, dropdown portals) are lifted to
  the top level so their ancestors' clipping doesn't cut them off.
- Elements Figma can't describe are screenshotted by the CLI with everything
  else hidden, then placed as images. That covers `<canvas>` (the 3D
  visualizer), video, native checkboxes/radios/ranges, icon fonts, rotated or
  3D-transformed elements (the view cube) and repeating radial or conic
  gradients.
- Tailwind tokens are found by rendering a hidden probe element with each
  candidate class (`bg-surface-raised`, …) and comparing the result to the
  element's computed color. That's how custom theme colors and
  `var(--primary)` colors resolve to the right value in the current theme.

## Developing the tool

```bash
yarn figma:test          # masking, matching, state planning, launcher arguments
yarn figma:sync-plugin   # after editing shared/*.cjs
```

A Figma plugin is two files that can't import anything, so
`shared/diff.cjs` and `shared/match.cjs` are pasted into `ui.html` and
`code.js` between marker comments by `sync-plugin.mjs`. Edit the files in
`shared/`, run the sync, and commit both; the tests fail if they drift.

## Limitations

- Fonts: CSS generic families map to fonts you are likely to have
  (`ui-sans-serif` → SF Pro Text → Inter, `ui-monospace` → SF Mono → Menlo).
  macOS hides its system font from other apps, so Figma only offers SF Pro
  once it's installed from https://developer.apple.com/fonts/; without it,
  *Match the app* falls back to Roboto, which runs wider. With SF Pro, text of
  20px and up uses SF Pro Display, and letter spacing follows the font's
  size-specific tracking the way macOS applies it.
  Text metrics differ a little between browsers and Figma, so single lines can
  come out slightly wider or narrower. Figma sometimes leaves text set through the API in local
  fonts (SF Pro especially) blank until the font is touched, so the plugin
  re-applies every text layer's font once the import finishes. Figma also
  measures those fonts too narrow, so their text layers stay auto-width rather
  than taking the browser's width, which keeps them from wrapping. If text is
  still blank, re-import with **Font → Inter + Inconsolata**.
- `::before`/`::after` boxes are not captured, except icon-font glyphs, which
  are screenshotted.
- Hover, focus and animation states are captured as they were at that moment
  (the Storybook capture's `--interaction-states` forces them for
  single-control stories).
- Linked prototypes and difference imports run inside Figma and have only
  been exercised through their shared logic's tests, not against every kind
  of file; check a linked flow in Figma's prototype view before relying on it.
- Only the popups visible on the captured screen are opened. Menus inside other
  tabs, and nested submenus, aren't.
- Grid containers stay absolutely positioned. Only non-wrapping flex
  containers become auto layout.
