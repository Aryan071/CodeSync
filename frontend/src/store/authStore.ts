import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  createdAt: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await api.post('/auth/login', { email, password })
          const { user, token } = response.data
          
          set({ user, token, isLoading: false })
          
          // Set token in axios defaults
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (username: string, email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await api.post('/auth/register', { username, email, password })
          const { user, token } = response.data
          
          set({ user, token, isLoading: false })
          
          // Set token in axios defaults
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        set({ user: null, token: null })
        delete api.defaults.headers.common['Authorization']
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token 
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
        }
      },
    }
  )
)
```

```

