<img width="2559" height="1384" alt="Screenshot 2026-07-26 165724" src="https://github.com/user-attachments/assets/bc0d92ed-2bd8-4e2c-878e-b902eaec3b8e" />


<img width="2555" height="1364" alt="Screenshot 2026-08-19 180136" src="https://github.com/user-attachments/assets/b3ac4625-a4d2-49a9-96a7-a7cba83ecb37" />

---

## 🎯 3D Touch Probing Suite (Material Center & Bore Finder)

> [!IMPORTANT]
> ⚠️ **Hardware Requirement:** Probing routines are designed specifically for use with an active **3D Touch Probe** (electronic/kinematic probe capable of omnidirectional contact detection in X, Y, and Z).

Added two dedicated, interactive 3D touch probing tools directly into the **Probe** widget for rapidly finding and zeroing the geometric center of both raw stock and pre-machined bores:

### 🔲 1. Material Center Finder (Rectangular Stock)
* **Direct UI Access:** Dedicated button in the Probe widget opening a rich configuration modal with real-time diagram illustration.
* **5-Point Automated Probing Workflow:** Probes Z top surface, hops over the material boundary at a safe clearance height, and probes all four outer edges (+X, -X, +Y, -Y).
* **Automatic Coordinate Zeroing:** Calculates the exact geometric center from measured touchpoints and sets `X0 Y0` on the active workspace coordinate system (`G10 L20 P0`).
* **Configurable & Persistent Probe Tip Diameter:** User-defined ball tip diameter that persists automatically across gSender restarts and reboots.
* **Dynamic Z Submergence:** Probing depth dynamically compensates for retract distance and ball tip diameter (`Z_UNDER_SURFACE = -(retract + tipDia)`), guaranteeing the probe ball always submerges exactly one full diameter below the top surface.

---

### 🔘 2. Bore / Hole Center Finder (Internal Cylindrical Bores)
* **Direct UI Access:** Dedicated circular crosshair button in the Probe widget with visual internal probe diagram.
* **4-Point Internal Probing Workflow:** Starts from inside the bore (roughly centered at probing depth) and probes the internal cylinder walls (+X, -X, +Y, -Y).
* **Smart Motion & Kinematics:** 
  * Features a dynamic $\ge 50\text{mm}$ threshold (`G0` rapid return for large bores, smooth controlled `G1 F800` traverse for tight/small bores).
  * Automatically repositions back to the safe start point between wall touches to eliminate blind rapid traversals across unverified geometry.
* **Automatic Center Zeroing:** Automatically zeroes the active coordinate system (`X0 Y0`) at the true cylindrical center.

---

### 📏 Full Dynamic Metric & Imperial Unit Support
* Automatically detects and adapts to the active workspace unit mode (**`mm` / `mm/min`** or **`in` / `in/min`**).
* Features high-precision background unit conversion ensuring sub-millimeter machine motion accuracy regardless of input unit selection.

---

### 🛡️ Enhanced Safety & UX Controls
* **Instant In-Modal Abort:** The modal stays open during execution with a prominent **⏹ Stop Macro** button directly under the cursor for immediate, zero-travel emergency aborts.
* **Input Validation:** Prevents execution until valid, positive dimensions are entered.
* **`G38.2` Contact Safety Guards:** Automatically triggers GRBL alarm and halts motion if contact is not made within the search margin, preventing runaway travel.

---

## ⚡ Configurable M7 / M8 Accessory Output Labels

Added user-configurable labels and presets for M7 and M8 accessory relay outputs to match custom CNC post-processors and shop setups:

* **Settings Integration:** Configurable under **Settings $\rightarrow$ Accessory Outputs**.
* **Preset Dropdowns:** Select from common presets (`Mist`, `Flood`, `Air`, `Vacuum`, `Dust Collector`, `Coolant`, `Aux 1`, `Aux 2`, `Laser Air Assist`, `Custom`).
* **Custom Text Inputs:** Selecting `Custom` reveals a dedicated text field for any user-defined label.
* **Dynamic UI Controls:** Main interface coolant/accessory buttons dynamically update their text, tooltips, and contextual icons (fan, wind, water, bolt) in real-time.
* **Workspace Persistence:** Custom labels persist across restarts within the workspace state.

