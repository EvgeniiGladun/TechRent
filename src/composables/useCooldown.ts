import { computed, onScopeDispose, ref } from 'vue'
import { formatSeconds } from '@/utils/format'

/**
 * Таймер «отправить код повторно через 0:29».
 * Запоминаем момент, когда таймер должен закончиться, и каждый тик считаем,
 * сколько до него осталось. Простой счётчик «минус одна секунда» врёт:
 * в фоновой вкладке браузер замедляет таймеры, и отсчёт отстаёт от реального времени.
 */
export const useCooldown = (defaultSeconds = 30) => {
  const endsAt = ref<number>(0)
  const now = ref<number>(Date.now())
  let interval: ReturnType<typeof setInterval> | null = null

  const secondsLeft = computed(() => Math.max(0, Math.ceil((endsAt.value - now.value) / 1000)))
  const isActive = computed(() => secondsLeft.value > 0)
  const formatted = computed(() => formatSeconds(secondsLeft.value))

  const stop = () => {
    if (interval) clearInterval(interval)
    interval = null
    endsAt.value = 0
  }

  const start = (seconds: number = defaultSeconds) => {
    if (interval) clearInterval(interval)
    now.value = Date.now()
    endsAt.value = now.value + seconds * 1000

    interval = setInterval(() => {
      now.value = Date.now()
      if (now.value >= endsAt.value) stop()
    }, 250)
  }

  onScopeDispose(stop)

  return { secondsLeft, isActive, formatted, start, stop }
}
