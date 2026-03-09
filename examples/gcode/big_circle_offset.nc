(150mm Diameter Circle - Positive Coordinate Space)

G21         ; Units in mm
G90         ; Absolute positioning
G17         ; XY plane

G0 Z5       ; Safe height

; Move to start point (right side of circle)
G0 X150 Y75

; Plunge
G1 Z-1.0 F300

; Draw full clockwise circle
G2 X150 Y75 I-75 J0 F800

; Retract
G0 Z5

; Optional return
G0 X0 Y0

M30
