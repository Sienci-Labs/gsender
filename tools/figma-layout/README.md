# Layout → Figma

Turns the live layout of gSender (or any web/Electron app) into editable Figma
layers: frames with fills, borders, radii and shadows, real text layers, SVG
icons as vectors, images, Tailwind colors as Figma variables, and flex
containers as auto layout.

It has two parts:

| Part | What it does |
| --- | --- |
| `capture/` | Reads the rendered DOM (computed styles + measured boxes) and writes a `.figma-layout.json` file. |
| `figma-plugin/` | A Figma plugin, **Layout Importer**, that builds those files into frames. |

Neither part needs `npm install`. The capture CLI uses Node 22+ and the
Chrome already on your machine.

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
| `-w 1280 -h 800` | Viewport size (default 1440×900). |
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
already on the page.

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

### Tabs, menus and popovers

While capturing, the tool also records the states you'd otherwise have to
click through:

- **Tab groups** (`role="tablist"`): it clicks each tab in turn and records
  the whole tab area, including the tabs scrolled out of the strip. In Figma
  these become a component set with a **Tab** variant property (Probe,
  Macros, Coolant, …). The screen gets an instance of the tab that was
  selected, so you can switch tabs from the instance's properties.
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
- Hover, focus and animation states are captured as they were at that moment.
- Only the popups visible on the captured screen are opened. Menus inside other
  tabs, and nested submenus, aren't.
- Grid containers stay absolutely positioned. Only non-wrapping flex
  containers become auto layout.
