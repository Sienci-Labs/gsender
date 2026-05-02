(250x250 square, offset into + space by 20mm diagonal)
G21         (mm)
G90         (absolute)
G94         (feed per minute)

G0 Z5       (safe height)
G0 X50 Y50  (diagonal indent into positive space)

G1 Z0 F300  (plunge - adjust/remove as needed)
G1 X300 Y50 F1200
G1 X300 Y300
G1 X50  Y300
G1 X50  Y50

G0 Z5       (retract)
M2          (end)