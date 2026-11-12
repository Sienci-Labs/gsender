import { createContext, useContext } from 'react';

// The Carve screen stays mounted while other pages are shown and hides with
// display:none. Hosts provide whether it is on screen so widgets inside it can
// skip work that only matters while visible. Defaults to true for widgets
// rendered outside a Carve host (pop-out console, etc.).
export const CarveVisibleContext = createContext(true);

export const useCarveVisible = () => useContext(CarveVisibleContext);
