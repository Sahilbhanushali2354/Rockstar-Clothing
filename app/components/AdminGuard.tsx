"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, FStore } from "@/firebase/firebase.config";
import Loader from "./Loader";

const AdminUserContext = createContext<User | null>(null);

/** The signed-in admin (only available inside <AdminGuard>). */
export const useAdminUser = () => useContext(AdminUserContext);

/*
 * Client-side gate for every /admin page: must be signed in AND have
 * users/{uid}.role === "admin". The real enforcement is server-side
 * (firestore.rules + /api/cloudinary/* checks); this keeps non-admins
 * out of the UI.
 */
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<"checking" | "allowed" | "denied">(
    "checking",
  );

  useEffect(() => {
    const loginUrl = `/auth/login?redirect=${encodeURIComponent(pathname || "/admin")}`;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setStatus("denied");
        router.replace(loginUrl);
        return;
      }

      try {
        const snapshot = await getDoc(doc(FStore, "users", firebaseUser.uid));

        if (snapshot.data()?.role === "admin") {
          setUser(firebaseUser);
          setStatus("allowed");
          return;
        }

        // Signed in, but not an admin.
        setStatus("denied");
        router.replace("/");
      } catch (error) {
        console.error("Admin check failed:", error);
        setStatus("denied");
        await signOut(auth).catch(() => undefined);
        router.replace(loginUrl);
      }
    });

    return () => unsubscribe();
    // pathname intentionally excluded: only re-check on auth changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  if (status !== "allowed") return <Loader label="Checking access" />;

  return <AdminUserContext.Provider value={user}>{children}</AdminUserContext.Provider>;
}
