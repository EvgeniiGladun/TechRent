<template>
  <VCard class="rent-panel">
    <h2>Оформить аренду</h2>

    <VAlert v-if="!possible" variant="warning">
      Сейчас оформить аренду нельзя: {{ LIMIT_HINTS[limits.maxReason].toLowerCase() }} —
      {{ formatCurrency(limits.max) }}, а минимальная сумма — {{ formatCurrency(limits.min) }}.
    </VAlert>

    <form v-else class="stack" novalidate @submit.prevent="submit">
      <VInput
        v-model="amountInput"
        label="Стоимость техники"
        mask="amount"
        suffix="₽"
        :error="amountError"
        :hint="`От ${formatCurrency(limits.min)} до ${formatCurrency(limits.max)}`"
        :disabled="isPending"
      />

      <div class="rent-panel__chips">
        <button
          v-for="chip in availableChips"
          :key="chip"
          type="button"
          class="rent-panel__chip"
          :class="{ 'rent-panel__chip--active': amount === chip }"
          @click="setAmount(chip)"
        >
          {{ formatCurrency(chip) }}
        </button>
        <button type="button" class="rent-panel__chip" @click="setAmount(limits.max)">
          Максимум
        </button>
      </div>

      <dl class="rent-panel__limits small">
        <div>
          <dt class="muted">Залог на счёте</dt>
          <dd class="tabular">{{ formatCurrency(user.balance) }}</dd>
        </div>
        <div v-if="limits.yearlyLeft !== null">
          <dt class="muted">Остаток годового лимита</dt>
          <dd class="tabular">{{ formatCurrency(limits.yearlyLeft) }}</dd>
        </div>
        <div>
          <dt class="muted">Ограничивает максимум</dt>
          <dd>{{ LIMIT_HINTS[limits.maxReason] }}</dd>
        </div>
      </dl>

      <div v-if="schedule" class="rent-panel__summary">
        <div>
          <span class="muted small">Аренда за срок</span>
          <strong class="rent-panel__total-rent tabular">
            {{ formatCurrency(schedule.totalRent) }}
          </strong>
        </div>
        <div>
          <span class="muted small">Заплатите всего</span>
          <strong class="tabular">{{ formatCurrency(schedule.totalPayment) }}</strong>
        </div>
      </div>

      <VAlert v-if="errorMessage" variant="danger">{{ errorMessage }}</VAlert>
      <VAlert v-if="isSuccess" variant="success">
        Аренда оформлена. Залог и загрузка парка обновлены.
      </VAlert>

      <VButton type="submit" block :loading="isPending" :disabled="!canSubmit">
        Арендовать за {{ canSubmit ? formatCurrency(amount) : '' }}
      </VButton>
    </form>

    <ScheduleTable v-if="possible && schedule" :schedule="schedule" />
  </VCard>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import type { Equipment, User } from '@/api/schemas'
import { RENT_CHIPS } from '@/constants'
import { formatCurrency } from '@/utils/format'
import VAlert from '@/components/ui/VAlert.vue'
import VButton from '@/components/ui/VButton.vue'
import VCard from '@/components/ui/VCard.vue'
import VInput from '@/components/ui/VInput.vue'
import ScheduleTable from './ScheduleTable.vue'
import { LIMIT_HINTS, isRentPossible } from './limits'
import { useRentOrder } from './useRentOrder'

const props = defineProps<{ equipment: Equipment; user: User }>()

const {
  limits,
  amountInput,
  amount,
  amountError,
  schedule,
  canSubmit,
  isPending,
  isSuccess,
  errorMessage,
  setAmount,
  submit,
} = useRentOrder(toRef(props, 'equipment'), toRef(props, 'user'))

const possible = computed(() => isRentPossible(limits.value))

const availableChips = computed(() =>
  RENT_CHIPS.filter(chip => chip >= limits.value.min && chip <= limits.value.max)
)
</script>

<style scoped>
.rent-panel {
  display: flex;
  flex-direction: column;
  gap: var(--gap-16);
}

.rent-panel__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-8);
}

.rent-panel__chip {
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  font-size: 13px;
  cursor: pointer;
}

.rent-panel__chip:hover,
.rent-panel__chip--active {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.rent-panel__limits {
  display: flex;
  flex-direction: column;
  gap: var(--gap-4);
  margin: 0;
}

.rent-panel__limits div {
  display: flex;
  justify-content: space-between;
  gap: var(--gap-8);
}

.rent-panel__limits dd {
  margin: 0;
  text-align: right;
}

.rent-panel__summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--gap-12);
  padding: 14px;
  border-radius: var(--radius-m);
  background: var(--color-accent-soft);
}

.rent-panel__summary div {
  display: flex;
  flex-direction: column;
}

.rent-panel__total-rent {
  color: var(--color-accent);
  font-size: 18px;
}
</style>
