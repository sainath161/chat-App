import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { create } from "zustand";
import { db } from "./firebase";

export const useUserStore = create((set) => ({
  currentUser: null,
  isLoading: true,
  fetchUserInfo: async (uid) => {
    if (!uid) return set({ currentUser: null, isLoading: false });

    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        set({
          currentUser: docSnap.data(),
          isLoading: false,
        });
      } else {
        set({
          currentUser: null,
          isLoading: false,
        });
        toast.info("No user found with provided ID");
      }
    } catch (error) {
      toast.error("Failed to load user info");
      return set({ currentUser: null, isLoading: false });
    }
  },
}));
