import axios from "axios"
import * as SecureStore from "expo-secure-store"

const baseURL = "https://deegipay.com/backend_pos/api/v1"

let onUnauthorized = async () => {}

export function setOnUnauthorized(callback) {
  onUnauthorized = callback
}

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
})

api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (err) => Promise.reject(err)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await onUnauthorized()
    }
    return Promise.reject(error)
  }
)

export default api
export { baseURL }
