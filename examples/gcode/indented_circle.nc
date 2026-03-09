(200mm DIA CIRCLE USING ARCS)
(Offset so the *outer edge point* is at the end of the diagonal G0)
G90            (absolute positioning)
G21            (mm units)
G17            (XY plane)

G0 X50 Y50     (diagonal indent into + space: this is an OUTER EDGE point)

(From X50 Y50, circle center is at X120.7107 Y120.7107 => I=J=+70.7107)
G2 X191.4214 Y191.4214 I70.7107 J70.7107   (first 180 degrees)
G2 X50      Y50      I-70.7107 J-70.7107   (second 180 degrees, back to start)
