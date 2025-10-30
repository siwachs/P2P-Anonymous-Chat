import { useStore, useDispatch, useSelector } from "react-redux";

import type { AppStore, RootState, AppDispatch } from ".";

export const useAppStore = useStore.withTypes<AppStore>();
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
