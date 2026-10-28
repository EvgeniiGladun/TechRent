<template>
  <RouterLink :to="`/equipment/${equipment.id}`" class="equipment-card">
    <VCard class="equipment-card__inner">
      <div class="equipment-card__top">
        <span class="equipment-card__badge" :class="`equipment-card__badge--${equipment.status}`">
          {{ equipmentStatus.textOf(equipment.status) }}
        </span>
        <span class="muted small">{{ paymentType.textOf(equipment.payment_type) }}</span>
      </div>

      <div>
        <h3>{{ equipment.title }}</h3>
        <p class="muted small">{{ equipment.owner }}</p>
      </div>

      <dl class="equipment-card__terms">
        <div>
          <dt class="muted small">Арендная ставка</dt>
          <dd>{{ formatPercent(equipment.rate) }}</dd>
        </div>
        <div>
          <dt class="muted small">Срок</dt>
          <dd>
            {{ equipment.term_months }}
            {{ plural(equipment.term_months, ['месяц', 'месяца', 'месяцев']) }}
          </dd>
        </div>
      </dl>

      <div class="stack equipment-card__progress">
        <VProgress
          :value="equipment.rented_value"
          :max="equipment.fleet_value"
          label="Загрузка парка"
        />
        <div class="row small tabular equipment-card__amounts">
          <span>{{ formatCurrency(equipment.rented_value) }}</span>
          <span class="muted">в аренде из {{ formatCurrency(equipment.fleet_value) }}</span>
        </div>
      </div>
    </VCard>
  </RouterLink>
</template>

<script setup lang="ts">
import type { Equipment } from '@/api/schemas'
import { equipmentStatus, paymentType } from '@/utils/dictionaries'
import { formatCurrency, formatPercent, plural } from '@/utils/format'
import VCard from '@/components/ui/VCard.vue'
import VProgress from '@/components/ui/VProgress.vue'

defineProps<{ equipment: Equipment }>()
</script>

<style scoped>
.equipment-card {
  display: block;
  color: inherit;
  text-decoration: none !important;
}

.equipment-card__inner {
  display: flex;
  flex-direction: column;
  gap: var(--gap-16);
  height: 100%;
  transition:
    transform 0.15s,
    box-shadow 0.15s;
}

.equipment-card:hover .equipment-card__inner {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgb(21 33 43 / 8%);
}

.equipment-card__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.equipment-card__badge {
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: var(--color-surface-muted);
}

.equipment-card__badge--available {
  background: var(--color-accent-soft);
  color: var(--color-accent);
}

.equipment-card__terms {
  display: flex;
  gap: var(--gap-32);
  margin: 0;
}

.equipment-card__terms dd {
  margin: 0;
  font-weight: 650;
  font-size: 17px;
}

.equipment-card__progress {
  gap: var(--gap-8);
  margin-top: auto;
}

.equipment-card__amounts {
  justify-content: space-between;
}
</style>
