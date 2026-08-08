# Height Map Tool — verification

The Height Map tool probes a grid of points on the workpiece and rewrites a
G-code program's Z values so cut depth follows the real surface. It exists for
work like PCB isolation milling, where 0.1 mm of surface variation is the
difference between a clean trace and a dead board.

This document covers **what cannot be asserted in software**. Everything that
can be is an executable test — see the inventory below rather than duplicating
it in prose. This file previously described the automated cases too, and drifted
badly enough to document three defects as intended behaviour; keeping the
descriptions in one place only is deliberate.

---

## 1. Automated coverage

176 tests across 9 suites, all under `src/app/src/features/HeightMap/__tests__/`.

| Suite | Tests | Covers |
|---|---|---|
| `arcFlatten.test.ts` | 22 | Arc maths: sweep direction, ±π wraparound, full circles, sagitta↔segment count, plane un-swizzling, endpoint snapping, helical Z, radius-mismatch absorption |
| `gcodeTransformer.defects.test.ts` | 23 | Regression guards for modal motion, arc position tracking, line numbers; arc compensation; G91 programs; position barriers; refusals; passthrough fidelity |
| `gcodeTransformer.integration.test.ts` | 7 | A hostile program against a warped surface, checked on whole-program invariants |
| `gcodeTransformer.stress.test.ts` | 29 | Property tests: the map affects Z only; zero-map identity; map+inverse round-trip; drift over 20k moves; malformed input; extreme surfaces; feed placement; probe bounds derivation |
| `gcodeTransformer.realFiles.test.ts` | 1 | A local corpus of real Fusion output. Skips when the corpus is absent |
| `probeRoutine.test.ts` | 41 | Probe command generation, datum conversion, work-offset resolution, travel validation, timeout calculation |
| `probeCycle.test.ts` | 21 | Cycle state machine as pure functions: response parsing, point matching, mismatch policy, timeout handling |
| `probeDatum.integration.test.ts` | 19 | The datum end to end — probe samples in machine coordinates through to compensated depth |
| `probeStateMachine.test.tsx` | 13 | The mounted component: watchdog, stray responses, alarm handling, listener lifetime, timer teardown |

### The invariants worth knowing

Most of the above reduces to three whole-program properties. If you change this
feature, these are what must not break:

1. **The map affects Z and nothing else.** Running one program through a flat
   map and a warped map must produce bit-identical XY on every move, with Z
   differing by exactly the interpolated map value.
2. **The emitted path is continuous.** A positional discontinuity means the
   transformer lost track of the tool, and the machine executes a full-depth
   cutting move back through finished material.
3. **Subtracting the map recovers a commanded depth.** For every emitted move,
   `emittedZ − map(x,y)` must be a depth the source program actually asked for.
   This is the strongest available statement that compensation was applied
   exactly once, everywhere, and invented nothing.

---

## 2. Behaviour that changed from the original plan

The first version of this document described the feature as first written. Four
of those behaviours were defects and have been fixed. They are listed here
because the old descriptions read as specifications, and anyone working from
them would reintroduce the faults.

| Was documented as | Actual behaviour | Why |
|---|---|---|
| Arcs preserved, not transformed | Arcs are flattened to segments and compensated | An uncompensated `G2` cuts at the programmed depth while everything around it is offset. Worse, the original parser did not track position across an arc, so every later move was segmented from a stale origin — a full-depth cutting move back through finished material |
| `G91` sections skipped | Incremental moves are resolved to absolute and compensated | Skipping them left real cutting moves uncompensated |
| `normalizeHeightMap` shifts the lowest point to zero | Removed | It made the low spot the datum instead of work Z zero, so every cut was off by a constant `hmin`. It was also accidentally load-bearing — see below |
| Probe depth `G38.2 Z-{depth}` under `G90` | `G91` then `G38.2`, with `G90` restored | Absolute motion made "max probe depth" an absolute target rather than a travel distance, so real travel was `zClearance + maxProbeDepth` |

Two further points, because they are easy to get wrong again:

- **`[PRB:...]` reports machine coordinates, not work coordinates.** Both grbl
  and grblHAL state "Report in terms of machine position" in `report.c`, and
  gSender forwards the line untouched. Readings are converted with
  `WPos = MPos − WCO` using the offset captured once at the start of the cycle.
  The old normalisation hid this, because subtracting the minimum also cancelled
  the work offset. Removing normalisation *without* converting turns a sub-
  millimetre error into a full-depth plunge — on a Z-max-homed machine, a
  commanded `Z-0.15` becomes `Z-85.15`.
- **Interpolation extrapolates outside the probed area**, it does not return
  `null` or `0`. Toolpath beyond the grid is compensated from the nearest edge
  points, with a warning. This matters when the Edge Inset pulls the probe area
  inside the toolpath extents, which is the normal case.

---

## 3. Hardware verification

Nothing below is covered by the automated suite. Every test above synthesises
probe responses; none of this code has seen a real controller.

Work through these **in order**, with the spindle off and the bit clear of the
stock, before trusting a probe cycle or cutting a compensated program.

### 3.1 Datum — do this first, it needs no motion

| # | Action | Expected | If it fails |
|---|---|---|---|
| 1 | Jog to a known point, zero Z on the surface | `wpos.z ≈ 0`, `mpos.z` large and negative | — |
| 2 | Run a 2×2 probe | Every map value within a few hundredths of zero | **Values near ±85 mean the work-offset conversion is inverted. Stop.** |

### 3.2 Refusals — should never reach the machine

| # | Action | Expected |
|---|---|---|
| 3 | Set Max Probe Depth below Z Clearance, start probing | Refused before any motion, explaining the probe cannot reach |
| 4 | Disconnect, start probing | Refused, citing the missing work coordinate offset |
| 5 | Set an Edge Inset larger than half the toolpath, click Use File Bounds | Refused, bounds fall back to full extents |

### 3.3 Fault paths — the ones that protect hardware

| # | Action | Expected | Notes |
|---|---|---|---|
| 6 | Start a probe with the probe clip **off** | Cycle stops within ~45 s naming "point 1 of N"; tool retracts to clearance | Keep a hand on the E-stop. This is the watchdog, and it is the single most important check here |
| 7 | Trip a limit or soft limit mid-probe | Cycle stops with the alarm reported | — |
| 8 | After 7: `$X`, then jog Z a known 5 mm | Moves **5 mm**, not to `Z=5` | This is the G91 leak check. An alarm flushes the queued `G90`, and if the restore did not land the session is still incremental |
| 9 | Abort mid-cycle with Stop, then jog Z 5 mm | Moves 5 mm | Same check, abort path |
| 10 | Mid-cycle, trigger a probe from the Probe widget or a macro | Height map cycle continues and finishes with a sane surface | Cross-talk rejection |
| 11 | Trigger three strays in a row | Cycle aborts naming expected vs received XY | Mismatch policy |

### 3.4 Accuracy

| # | Action | Expected |
|---|---|---|
| 12 | Full 11×11 grid on real stock | Map range agrees with a dial indicator swept over the same area, to within probe repeatability |
| 13 | Start a cycle, change WCS or issue `G92` partway | "Work Z zero moved during probing" warning appears rather than a silently mixed-datum map |

### 3.5 First cut

| # | Action | Expected |
|---|---|---|
| 14 | Generate compensated G-code, run it **5 mm above** the stock with a hand-applied Z offset | Z visibly tracks the surface shape |
| 15 | Only then, cut a shallow test pattern | Depth consistent across the board |

### 3.6 Imperial

If you work in inches, repeat **1**, **2** and **6** with the workspace set to
inches. The transformer normalises units internally and is tested both ways, but
the probe path has only been exercised in software.

---

## 4. Known gaps

- No part of the probe path has run against a real controller. Serial timing and
  framing, `gcode:safe` unit wrapping on a genuinely imperial device, and
  whether grbl really rejects `G90` with `error:9` while alarmed are all
  reasoned from documentation rather than observed.
- The real effect of `feedhold` + `reset` on modal state is unverified.
- `GridVisualizer` rendering is untested.
- `.gshmap` files saved before the datum fix cannot be migrated — the original
  datum is unrecoverable once normalisation was applied. Loading one warns; it
  should be re-probed.
- The repository has no working typecheck or linter (`tsc` is 3.9.10 and fails
  on modern `.d.ts` in `node_modules`; `eslint` fails to resolve
  `eslint/use-at-your-own-risk`). Both predate this feature, so type errors are
  caught only by the tests actually exercising a path.
