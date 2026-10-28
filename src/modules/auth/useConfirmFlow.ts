import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authApi } from '@/api/endpoints'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import { useCooldown } from '@/composables/useCooldown'
import { useErrorHandler } from '@/composables/useErrorHandler'
import {
  CONFIRM_PURPOSE,
  HTTP_STATUS,
  OTP,
  ROUTES,
  SCREEN_STATUS,
  type ConfirmPurpose,
  type ScreenStatus,
} from '@/constants'
import { flowStorage, clearAllFlows, type SessionSlot } from '@/utils/session-storage'
import { validateCode } from '@/utils/validation'
import { messages } from '@/utils/messages'
import { safeRedirect } from '@/router/access'

interface FlowConfig {
  title: string
  storage: SessionSlot<{ phone: string; session_id: string }>
  fallbackRoute: string
  confirm: (sessionId: string, code: string) => Promise<string>
}

const isPurpose = (value: unknown): value is ConfirmPurpose =>
  Object.values(CONFIRM_PURPOSE).includes(value as ConfirmPurpose)

export const useConfirmFlow = () => {
  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()
  const userStore = useUserStore()
  const cooldown = useCooldown(OTP.RESEND_COOLDOWN_SEC)

  const code = ref('')
  const codeError = ref('')
  const isLoading = ref(false)

  const { handleError, clearError } = useErrorHandler({
    context: 'Confirm',
    statusHandlers: {
      [HTTP_STATUS.UNPROCESSABLE_ENTITY]: error => {
        codeError.value = error.message || messages.codeInvalid
        code.value = ''
      },
      [HTTP_STATUS.TOO_MANY_REQUESTS]: error => {
        if (error.retryAfter) cooldown.start(error.retryAfter)
        codeError.value = error.message
      },
      [HTTP_STATUS.NOT_FOUND]: () => {
        codeError.value = messages.sessionExpired
      },
    },
    handlers: {
      NETWORK: () => {
        codeError.value = 'Нет соединения с сервером'
      },
    },
  })

  const signIn = async (sessionId: string, value: string, status: ScreenStatus) => {
    const tokens = await authApi.confirm({ session_id: sessionId, code: value })
    authStore.setTokens(tokens)
    authStore.setScreenStatus(status)
    await userStore.load(true)
    return safeRedirect(route.query.redirect, ROUTES.STATUS)
  }

  // Одна страница ввода кода обслуживает вход, регистрацию и восстановление пароля.
  // Здесь описано, чем сценарии отличаются: где лежат их данные, куда вернуть
  // при потере данных и что сделать после верного кода.
  const FLOWS: Record<ConfirmPurpose, FlowConfig> = {
    [CONFIRM_PURPOSE.LOGIN]: {
      title: 'Вход в аккаунт',
      storage: flowStorage.login,
      fallbackRoute: ROUTES.LOGIN,
      confirm: (sessionId, value) => signIn(sessionId, value, SCREEN_STATUS.AUTHORIZED),
    },
    [CONFIRM_PURPOSE.REGISTER]: {
      title: 'Подтверждение регистрации',
      storage: flowStorage.register,
      fallbackRoute: ROUTES.REGISTER,
      confirm: (sessionId, value) => signIn(sessionId, value, SCREEN_STATUS.REGISTERED),
    },
    [CONFIRM_PURPOSE.RECOVERY]: {
      title: 'Восстановление пароля',
      storage: flowStorage.recovery,
      fallbackRoute: ROUTES.RECOVERY,
      confirm: async (sessionId, value) => {
        const { reset_token } = await authApi.confirmRecovery({
          session_id: sessionId,
          code: value,
        })
        const data = flowStorage.recovery.get()
        if (data) flowStorage.recovery.save({ ...data, reset_token })
        return ROUTES.NEW_PASSWORD
      },
    },
  }

  const purpose = computed<ConfirmPurpose | null>(() =>
    isPurpose(route.query.purpose) ? route.query.purpose : null
  )
  const flow = computed(() => (purpose.value ? FLOWS[purpose.value] : null))
  const flowData = ref(flow.value?.storage.get() ?? null)
  const phone = computed(() => flowData.value?.phone ?? '')

  const submit = async (value: string = code.value): Promise<void> => {
    if (!flow.value || !flowData.value || isLoading.value) return

    clearError()
    codeError.value = validateCode(value, OTP.LENGTH) ?? ''
    if (codeError.value) return

    isLoading.value = true
    try {
      const next = await flow.value.confirm(flowData.value.session_id, value)
      if (purpose.value !== CONFIRM_PURPOSE.RECOVERY) clearAllFlows()
      await router.push(next)
    } catch (error) {
      handleError(error)
    } finally {
      isLoading.value = false
    }
  }

  const resend = async (): Promise<void> => {
    if (!flowData.value || cooldown.isActive.value) return

    clearError()
    codeError.value = ''
    try {
      const { session_id, retry_after } = await authApi.resend(flowData.value.session_id)
      flowData.value = { ...flowData.value, session_id }
      flow.value?.storage.save(flowData.value)
      cooldown.start(retry_after)
    } catch (error) {
      handleError(error)
    }
  }

  onMounted(() => {
    if (!flow.value || !flowData.value) {
      router.replace(flow.value?.fallbackRoute ?? ROUTES.LOGIN)
      return
    }
    cooldown.start()
  })

  return {
    title: computed(() => flow.value?.title ?? ''),
    phone,
    code,
    codeError,
    isLoading,
    cooldown,
    submit,
    resend,
  }
}
