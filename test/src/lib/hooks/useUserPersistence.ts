import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";

import { userStorage } from "@/lib/db/userStorage";
import { setLoading, setUser } from "@/lib/store/slices/userSlice";

export const useUserPersistence = () => {
  const dispatch = useAppDispatch();
  const { isLoading, currentUser } = useAppSelector((state) => state.user);

  useEffect(() => {
    async function loadUser() {
      try {
        const savedUser = await userStorage.getCurrentUser();
        if (savedUser) dispatch(setUser(savedUser));
      } catch (error) {
        console.error("Failed to load user:", error);
      }

      dispatch(setLoading(false));
    }

    loadUser();
  }, [dispatch]);

  useEffect(() => {
    if (currentUser) userStorage.saveUser(currentUser).catch(console.error);
  }, [currentUser]);

  return { isLoading, currentUser };
};
