import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/api/endpoints'
import { queryClient } from '@/api/query-client'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import { ROUTES } from '@/constants'
import { logError } from '@/utils/error'

export const useLogout = () => {
  const router = useRouter()
  const authStore = useAuthStore()
  const userStore = useUserStore()
  const isLoading = ref(false)

  const logout = async () => {
    isLoading.value = true
    try {
      if (authStore.accessToken) await authApi.logout(authStore.refreshToken)
    } catch (error) {
      logError(error, 'Logout')
    } finally {
      authStore.clear()
      userStore.reset()
      queryClient.clear()
      isLoading.value = false
      await router.push(ROUTES.LOGIN)
    }
  }

  return { logout, isLoading }
}
