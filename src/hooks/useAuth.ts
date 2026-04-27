import { useState, useEffect } from 'react'
import { getMe } from '../api/auth'
import type { User } from '../types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      setIsLoading(false)
      return
    }
    getMe()
      .then((res) => setUser(res.data.data))
      .catch(() => localStorage.removeItem('accessToken'))
      .finally(() => setIsLoading(false))
  }, [])

  const logout = () => {
    localStorage.removeItem('accessToken')
    setUser(null)
  }

  return { user, isLoading, logout, isAuthenticated: !!user }
}
