import { RootState } from "app/store/redux";
import { TypedUseSelectorHook, useSelector } from "react-redux";

export const useTypedSelector: TypedUseSelectorHook<RootState> = useSelector;
