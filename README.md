<img width="2559" height="1384" alt="Screenshot 2026-07-26 165724" src="https://github.com/user-attachments/assets/bc0d92ed-2bd8-4e2c-878e-b902eaec3b8e" />
### 🎯 Material Center Finder

> **Note:** This feature requires an active 3D touch probe connected to your machine.

Added a custom interactive probing modal for quickly locating the precise geometric center of your material:

* **3D Probe Automated Workflow:** Probes Z height first, then probes all four material edges (-X, +X, -Y, +Y) using a 3D touch probe.
* **Automated Centering:** Calculates the exact center point based on measured edges and your custom material dimensions, then repositions the spindle directly to center zero.
* **Configurable Parameters:** Easily adjust Fast/Slow feedrates, Retract distances, and Safe Z heights directly inside the UI.
