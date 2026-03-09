(150mm Diameter Circle - Centered at 0,0)

G21         ; Set units to mm
G90         ; Absolute positioning
G17         ; XY plane selection

G0 Z5       ; Safe height

; Move to circle start point (right side of circle)
G0 X75 Y0

; Plunge to cutting depth
G1 Z-1.0 F300

; Draw full circle (clockwise)
G2 X75 Y0 I-75 J0 F800

; Retract
G0 Z5

; Return home (optional)
G0 X0 Y0

M30
