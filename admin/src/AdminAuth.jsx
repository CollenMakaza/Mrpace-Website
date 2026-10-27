import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, getToken, setToken, setUnauthorizedHandler } from "./api.js";

const Ctx = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    setToken(null);
    setAdmin(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!getToken()) {
      setReady(true);
      return;
    }
    api("/admin/me")
      .then((d) => setAdmin(d.admin))
      .catch(() => setToken(null))
      .finally(() => setReady(true));
  }, [logout]);

  const login = useCallback(async (email, password) => {
    const d = await api("/admin/login", { method: "POST", body: { email, password } });
    setToken(d.token);
    setAdmin(d.admin);
  }, []);

  return <Ctx.Provider value={{ admin, ready, login, logout }}>{children}</Ctx.Provider>;
}

export const useAdmin = () => useContext(Ctx);
