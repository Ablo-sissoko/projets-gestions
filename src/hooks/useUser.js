import { useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";

/**
 * Hook pour gérer les données utilisateur (SecureStore).
 * userInfos contient : id, entreprise_id, nomBoutique, emailBoutique, telephoneBoutique,
 * adresseBoutique, logoBoutique, nom, prenom, email, roleName
 */
export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  const loadUserData = useCallback(async () => {
    try {
      const [userStr, tokenStr] = await Promise.all([
        SecureStore.getItemAsync("user"),
        SecureStore.getItemAsync("token"),
      ]);

      if (userStr) {
        setUser(JSON.parse(userStr));
      } else {
        setUser(null);
      }
      setToken(tokenStr || null);
    } catch (error) {
      console.log("Erreur chargement user:", error);
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const updateUser = useCallback(async (newUserData) => {
    try {
      const raw = await SecureStore.getItemAsync("user");
      if (!raw) return false;
      const current = JSON.parse(raw);
      const updatedUser = { ...current, ...newUserData };
      await SecureStore.setItemAsync("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      return true;
    } catch (error) {
      console.log("Erreur mise à jour user:", error);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync("user");
      await SecureStore.deleteItemAsync("token");
      setUser(null);
      setToken(null);
    } catch (error) {
      console.log("Erreur logout:", error);
    }
  }, []);

  return { user, token, loading, loadUserData, updateUser, logout };
}
