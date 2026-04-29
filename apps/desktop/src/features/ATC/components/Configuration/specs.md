# 🛠 Developer Prompt for Widget Modal

## General
- Use **ShadCN** components where applicable
- Use **Tailwind CSS** utility classes
- Use the **classnames** NPM package to merge styles

---

## Specifications
- This tool will fit in a **compact modal**, both vertically and horizontally
- Modal contains **two tabs**:
    - **Config**: Main functionality
    - **Templates**: Blank for now; requirements TBD
- **Tab switching** should **persist configuration state** in the store (mock call is fine)
- Config tab stores values in a **JSON object** via an existing **store hook**
- Refer to attached image for layout inspiration (not strict—aim for more compact spacing)
- Config tab contains **three sections**:
    - **General**
    - **Tool Rack**
    - **Advanced**
- Below these sections is an **Apply button** with space for:
    - **Status updates**
    - **Progress bar** (shows **% completion**, **only visible during applying**)
- **Avoid validation** for now—inputs can be freely edited

---

## Config Tab Details

### General Section
- Two position inputs:
    - **Tool Length Sensor Position**
    - **Manual Tool Load Position**
- Each has:
    - Editable **3-axis numerical inputs**
    - A **"Use Current"** button (mocked onClick)
- **Offset Management**:
    - Use **ShadCN switch components**
    - Store values as `0` or `1` (not `true/false`)

### Tool Rack Section
- Hidden if disabled
- Inputs:
    - **Number of Racks** (numerical)
    - **Slot 1 Position**: Editable 3-axis numerical inputs + mocked "Use Current" button
    - **Offset Management**: Toggle components storing `0` or `1`

### Advanced Section
- Two toggles, stored as 0/1
- "Check Pressure with pressure sensor"
- "Check tool presence in rack to prevent collision"

---

## Look and Feel
- Primary color: `blue-500`
- Status colors:
    - Success: `green-500`
    - Error: `red-500`
    - Warning: `orange-500`
- Layout should be **compact and modal-friendly**
