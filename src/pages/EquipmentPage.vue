<template>
  <div class="equipment-page">
    <RouterLink :to="ROUTES.CATALOG" class="small">← Весь каталог</RouterLink>

    <template v-if="isPending">
      <VSkeleton height="40px" />
      <VSkeleton height="320px" radius="20px" />
    </template>

    <VAlert v-else-if="isError || !equipment" variant="danger">
      Техника не найдена или недоступна.
    </VAlert>

    <div v-else class="equipment-page__grid">
      <div class="stack">
        <div class="stack equipment-page__head">
          <span class="muted">{{ equipment.owner }}</span>
          <h1>{{ equipment.title }}</h1>
          <p>{{ equipment.description }}</p>
        </div>

        <VCard class="stack">
          <dl class="equipment-page__terms">
            <div v-for="term in terms" :key="term.label">
              <dt class="muted small">{{ term.label }}</dt>
              <dd class="tabular">{{ term.value }}</dd>
            </div>
          </dl>
          <VProgress
            :value="equipment.rented_value"
            :max="equipment.fleet_value"
            label="Загрузка парка"
          />
          <div class="row small tabular equipment-page__amounts">
            <span>В аренде {{ formatCurrency(equipment.rented_value) }}</span>
            <span class="muted">Парк {{ formatCurrency(equipment.fleet_value) }}</span>
          </div>
        </VCard>
      </div>

      <aside>
        <VAlert v-if="!isAvailable" variant="info">Свободной техники сейчас нет.</VAlert>
        <VAlert v-else-if="userStore.rentBlockReason" variant="warning">
          {{ userStore.rentBlockReason }}
        </VAlert>
        <RentPanel v-else-if="user" :equipment="equipment" :user="user" />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ROUTES } from '@/constants'
import { useEquipmentQuery } from '@/api/queries'
import { useUserStore } from '@/stores/user'
import { equipmentStatus, paymentType } from '@/utils/dictionaries'
import { formatCurrency, formatPercent, plural } from '@/utils/format'
import RentPanel from '@/modules/rent/RentPanel.vue'
import VAlert from '@/components/ui/VAlert.vue'
import VCard from '@/components/ui/VCard.vue'
import VProgress from '@/components/ui/VProgress.vue'
import VSkeleton from '@/components/ui/VSkeleton.vue'

const route = useRoute()
const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const { data: equipment, isPending, isError } = useEquipmentQuery(() => String(route.params.id))

const isAvailable = computed(() => equipmentStatus.is(equipment.value?.status, 'AVAILABLE'))

const terms = computed(() => {
  if (!equipment.value) return []
  const { rate, term_months, payment_type, renters_count, min_amount } = equipment.value
  return [
    { label: 'Арендная ставка', value: `${formatPercent(rate)} годовых` },
    {
      label: 'Срок',
      value: `${term_months} ${plural(term_months, ['месяц', 'месяца', 'месяцев'])}`,
    },
    { label: 'Платежи', value: paymentType.textOf(payment_type) },
    { label: 'Арендаторов', value: String(renters_count) },
    { label: 'Минимум', value: min_amount ? formatCurrency(min_amount) : 'Не задан' },
  ]
})
</script>

<style scoped>
.equipment-page {
  display: flex;
  flex-direction: column;
  gap: var(--gap-24);
}

.equipment-page__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: var(--gap-24);
  align-items: start;
}

.equipment-page__head {
  gap: var(--gap-8);
}

.equipment-page__terms {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: var(--gap-16);
  margin: 0;
}

.equipment-page__terms dd {
  margin: 0;
  font-size: 17px;
  font-weight: 650;
}

.equipment-page__amounts {
  justify-content: space-between;
}

aside {
  position: sticky;
  top: 88px;
}

@media (max-width: 900px) {
  .equipment-page__grid {
    /* minmax(0, …): иначе колонка растягивается по ширине графика платежей, и скролл таблицы не включается */
    grid-template-columns: minmax(0, 1fr);
  }

  aside {
    position: static;
  }
}
</style>
