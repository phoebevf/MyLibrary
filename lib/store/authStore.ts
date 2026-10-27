import { create } from "zustand";
import { supabase } from "../supabase/client";
import { User } from "../types/user";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  fetchUser: () => Promise<void>;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  fetchUser: async () => {
    set({ isLoading: true });
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();

    if (sessionUser) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("username, role")
        .eq("id", sessionUser.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") { // PGRST116 = No rows found
        console.error("Error fetching user profile:", profileError);

        if (profileError.code === "42P17") {
          console.log("Policy recursion error detected");
        }
      }

      const fullUser = {
        ...sessionUser,
        username:
          profile?.username || sessionUser.email?.split("@")[0] || "User",
        role: profile?.role || "user",
      };

      set({ user: fullUser, isAuthenticated: true, isLoading: false });
    } else {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
  clearUser: () => {
    set({ user: null, isAuthenticated: false });
  },
}));

supabase.auth.onAuthStateChange((event, session) => {
  const user = session?.user || null;
  const { fetchUser } = useAuthStore.getState();
  if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
    fetchUser();
  }
});

useAuthStore.getState().fetchUser();
