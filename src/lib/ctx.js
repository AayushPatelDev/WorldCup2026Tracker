import { createContext, useContext } from 'react';

// App-wide context: timezone, data, follow state, drawers, live clock.
// Provided once from App.jsx so deep components avoid prop drilling.
export const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);
