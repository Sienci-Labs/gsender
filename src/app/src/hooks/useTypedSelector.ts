import { TypedUseSelectorHook, useSelector } from 'react-redux';
import { RootState } from 'store/redux';

export const useTypedSelector: TypedUseSelectorHook<RootState> = useSelector;
