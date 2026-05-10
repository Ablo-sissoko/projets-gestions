import React, { createContext, useState, useEffect, useRef } from 'react'
import * as SecureStore from 'expo-secure-store'
import { setOnUnauthorized } from '../api/Axios'
import { navigationRef } from '../navigationRef'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const logoutRef = useRef()

  useEffect(() => {
    loadStoredAuth()
  }, [])

  useEffect(() => {
    setOnUnauthorized(async () => {
      await logoutRef.current?.()
      if (navigationRef.isReady()) {
        navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] })
      }
    })
  }, [])

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('token')
      const storedUser = await SecureStore.getItemAsync('user')
      if (storedToken) setToken(storedToken)
      if (storedUser) {
        let u = JSON.parse(storedUser)
        if (u?.categoryIdBoutique != null && u.category_id == null) {
          u = { ...u, category_id: u.categoryIdBoutique }
          await SecureStore.setItemAsync('user', JSON.stringify(u))
        }
        setUser(u)
      }
    } catch (e) {
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (newToken, userData = null) => {
    await SecureStore.setItemAsync('token', newToken)
    setToken(newToken)
    if (userData) {
      await SecureStore.setItemAsync('user', JSON.stringify(userData))
      setUser(userData)
    }
  }

  const logout = async () => {
    await SecureStore.deleteItemAsync('token')
    await SecureStore.deleteItemAsync('user')
    setToken(null)
    setUser(null)
  }

  logoutRef.current = logout

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
