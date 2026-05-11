import type { AuthProvider } from "react-admin";

const readStoredUser = (): { id: string; fullName: string; isAdmin?: boolean } | null => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const u = JSON.parse(raw) as { id?: number; username?: string; email?: string; isAdmin?: boolean };
    if (!u?.isAdmin) return null;
    const name = u.username || u.email || String(u.id ?? "");
    return { id: String(u.id ?? ""), fullName: name, isAdmin: u.isAdmin };
  } catch {
    return null;
  }
};

export const superAdminAuthProvider: AuthProvider = {
  login: () => Promise.resolve(),
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    return Promise.resolve();
  },
  checkAuth: () => {
    const token = localStorage.getItem("token");
    const user = readStoredUser();
    if (!token || !user) return Promise.reject();
    return Promise.resolve();
  },
  checkError: (error) => {
    const status = error?.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      return Promise.reject();
    }
    return Promise.resolve();
  },
  getIdentity: () => {
    const user = readStoredUser();
    if (!user) return Promise.reject();
    return Promise.resolve({ id: user.id, fullName: user.fullName });
  },
  getPermissions: () => Promise.resolve("admin"),
};
