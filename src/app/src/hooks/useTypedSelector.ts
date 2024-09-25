import { TypedUseSelectorHook, useSelector } from 'react-redux';

import { RootState } from 'app/store/redux';

export const useTypedSelector: TypedUseSelectorHook<RootState> = useSelector;
