export interface SessionSlot<T> {
  save: (data: T) => void
  get: () => T | null
  clear: () => void
}

const isBrowser = (): boolean => typeof window !== 'undefined' && !!window.sessionStorage

export const createSessionSlot = <T>(key: string): SessionSlot<T> => ({
  save(data) {
    if (!isBrowser()) return
    try {
      sessionStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error(`[sessionStorage] Не удалось сохранить "${key}"`, error)
    }
  },
  get() {
    if (!isBrowser()) return null
    try {
      const raw = sessionStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : null
    } catch (error) {
      console.error(`[sessionStorage] Не удалось прочитать "${key}"`, error)
      return null
    }
  },
  clear() {
    if (!isBrowser()) return
    try {
      sessionStorage.removeItem(key)
    } catch (error) {
      console.error(`[sessionStorage] Не удалось удалить "${key}"`, error)
    }
  },
})

export interface LoginFlowData {
  phone: string
  session_id: string
}

export interface RegisterFlowData {
  phone: string
  session_id: string
}

export interface RecoveryFlowData {
  phone: string
  session_id: string
  reset_token?: string
}

export const flowStorage = {
  login: createSessionSlot<LoginFlowData>('flow:login'),
  register: createSessionSlot<RegisterFlowData>('flow:register'),
  recovery: createSessionSlot<RecoveryFlowData>('flow:recovery'),
}

export const clearAllFlows = (): void => {
  Object.values(flowStorage).forEach(slot => slot.clear())
}
