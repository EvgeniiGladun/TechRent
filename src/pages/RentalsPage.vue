<template>
  <div class="stack rentals-page">
    <div>
      <h1>Мои аренды</h1>
      <p class="muted">Арендованная техника, платежи и график выкупа</p>
    </div>

    <div class="rentals-page__summary">
      <template v-if="isPending">
        <VSkeleton v-for="index in 4" :key="index" height="88px" radius="20px" />
      </template>
      <template v-else-if="summary">
        <VCard class="rentals-page__tile">
          <span class="small muted">Техника в аренде</span>
          <strong class="tabular">{{ formatCurrency(summary.rentedValue) }}</strong>
        </VCard>
        <VCard class="rentals-page__tile">
          <span class="small muted">Аренда за весь срок</span>
          <strong class="tabular">{{ formatCurrency(summary.totalRent) }}</strong>
        </VCard>
        <VCard class="rentals-page__tile">
          <span class="small muted">Ближайший платёж</span>
          <strong class="tabular">
            {{ summary.nextPayment ? formatCurrency(summary.nextPayment.amount) : '—' }}
          </strong>
          <span v-if="summary.nextPayment" class="small muted">
            {{ formatDate(summary.nextPayment.date) }}
          </span>
        </VCard>
        <VCard
          class="rentals-page__tile"
          :class="{ 'rentals-page__tile--danger': summary.overdueAmount > 0 }"
        >
          <span class="small muted">Просрочено платежей</span>
          <strong class="tabular">{{ formatCurrency(summary.overdueAmount) }}</strong>
        </VCard>
      </template>
    </div>

    <VAlert v-if="isError" variant="danger">Не удалось загрузить аренды</VAlert>

    <VCard v-else :padded="false" class="rentals-page__card">
      <div class="rentals-page__toolbar">
        <div class="rentals-page__tabs" role="tablist" aria-label="Статус аренд">
          <button
            v-for="item in RENTALS_TABS"
            :key="item.value"
            type="button"
            role="tab"
            class="rentals-page__tab"
            :class="{ 'rentals-page__tab--active': tab === item.value }"
            :aria-selected="tab === item.value"
            @click="tab = item.value"
          >
            {{ item.label }}
            <span class="rentals-page__count">{{ counts[item.value] }}</span>
          </button>
        </div>
        <VInput
          v-model="search"
          class="rentals-page__search"
          label="Поиск"
          placeholder="Техника, арендодатель, сумма, дата"
        />
      </div>

      <VSkeleton v-if="isPending" height="240px" radius="0" />
      <DataTable
        v-else
        v-model:sort="sort"
        :rows="view"
        :columns="columns"
        row-key="id"
        :row-class="row => (row.isOverdue ? 'rentals-page__row--overdue' : undefined)"
      >
        <template #cell-title="{ row }">
          <span class="rentals-page__title">
            <RouterLink :to="`/equipment/${row.equipment_id}`">{{ row.title }}</RouterLink>
            <span class="small muted">{{ row.owner }}</span>
          </span>
        </template>
        <template #cell-status="{ row }">
          <span v-if="row.isOverdue" class="rentals-page__tag rentals-page__tag--danger">
            Просрочка
          </span>
          <span v-else class="rentals-page__tag">{{ rentalStatus.textOf(row.status) }}</span>
        </template>
        <template #empty>
          {{ search ? `По запросу «${search}» ничего не найдено` : emptyMessage }}
        </template>
      </DataTable>
    </VCard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRentalsQuery } from '@/api/queries'
import { rentalStatus } from '@/utils/dictionaries'
import { formatCurrency, formatDate, formatPercent } from '@/utils/format'
import { useDebouncedRef } from '@/composables/useDebouncedRef'
import type { TableSort } from '@/modules/data-table/table-query'
import {
  RENTALS_TAB,
  RENTALS_TABS,
  buildRentalsView,
  countByTab,
  getRentalsSummary,
  toRentalRows,
  type RentalRow,
  type RentalsTab,
} from '@/modules/rentals/rentals'
import DataTable, { type TableColumn } from '@/modules/data-table/DataTable.vue'
import VAlert from '@/components/ui/VAlert.vue'
import VCard from '@/components/ui/VCard.vue'
import VInput from '@/components/ui/VInput.vue'
import VSkeleton from '@/components/ui/VSkeleton.vue'

const columns: TableColumn<RentalRow>[] = [
  { key: 'title', label: 'Техника', sortable: true },
  { key: 'status', label: 'Статус' },
  {
    key: 'amount',
    label: 'Стоимость',
    sortable: true,
    align: 'right',
    value: row => formatCurrency(row.amount),
  },
  {
    key: 'rate',
    label: 'Ставка',
    sortable: true,
    align: 'right',
    value: row => formatPercent(row.rate),
  },
  {
    key: 'total_rent',
    label: 'Аренда',
    sortable: true,
    align: 'right',
    value: row => formatCurrency(row.total_rent),
  },
  {
    key: 'next_payment',
    label: 'Следующий платёж',
    align: 'right',
    value: row => (row.nextPayment ? formatDate(row.nextPayment.date) : '—'),
  },
  {
    key: 'ends_at',
    label: 'Окончание',
    sortable: true,
    align: 'right',
    value: row => formatDate(row.ends_at),
  },
]

const { data, isPending, isError } = useRentalsQuery()

const tab = ref<RentalsTab>(RENTALS_TAB.ACTIVE)
const search = ref('')
const sort = ref<TableSort | null>({ key: 'ends_at', order: 'asc' })
const debouncedSearch = useDebouncedRef(search, 200)

const today = new Date()

const rows = computed(() =>
  data.value ? toRentalRows(data.value.rentals, data.value.payments, today) : []
)
const counts = computed(() => countByTab(rows.value))
const summary = computed(() =>
  data.value ? getRentalsSummary(rows.value, data.value.payments, today) : null
)
const view = computed(() =>
  buildRentalsView({
    rows: rows.value,
    tab: tab.value,
    search: debouncedSearch.value,
    sort: sort.value,
  })
)
const emptyMessage = computed(() => RENTALS_TABS.find(item => item.value === tab.value)?.empty)

watch(tab, () => {
  search.value = ''
})
</script>

<style scoped>
.rentals-page {
  gap: var(--gap-24);
}

.rentals-page__summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--gap-16);
}

.rentals-page__tile {
  display: flex;
  flex-direction: column;
  gap: var(--gap-4);
}

.rentals-page__tile strong {
  font-size: 20px;
}

.rentals-page__tile--danger strong {
  color: var(--color-danger);
}

.rentals-page__card {
  overflow: hidden;
}

.rentals-page__toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-end;
  gap: var(--gap-16);
  padding: var(--gap-16);
}

.rentals-page__tabs {
  display: flex;
  min-width: 0;
  max-width: 100%;
  gap: var(--gap-4);
  padding: 4px;
  border-radius: var(--radius-m);
  background: var(--color-surface-muted);
  overflow-x: auto;
}

.rentals-page__tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 0;
  border-radius: var(--radius-s);
  background: none;
  color: var(--color-text-muted);
  font-weight: 550;
  white-space: nowrap;
  cursor: pointer;
}

.rentals-page__tab--active {
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-card);
}

.rentals-page__count {
  min-width: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--color-border);
  font-size: 12px;
  text-align: center;
}

.rentals-page__search {
  flex: 0 1 320px;
}

.rentals-page__title {
  display: inline-flex;
  flex-direction: column;
  white-space: normal;
}

.rentals-page__tag {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--color-success-soft);
  color: var(--color-success);
  font-size: 13px;
}

.rentals-page__tag--danger {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

:deep(.rentals-page__row--overdue) td:first-child {
  box-shadow: inset 3px 0 0 var(--color-danger);
}

@media (max-width: 960px) {
  .rentals-page__summary {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 720px) {
  .rentals-page__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .rentals-page__search {
    flex-basis: auto;
  }

  .rentals-page__summary {
    gap: var(--gap-8);
  }

  .rentals-page__tile strong {
    font-size: 17px;
  }

  .rentals-page__title {
    align-items: flex-end;
    text-align: right;
  }

  :deep(.rentals-page__row--overdue) {
    box-shadow: inset 3px 0 0 var(--color-danger);
  }

  :deep(.rentals-page__row--overdue) td:first-child {
    box-shadow: none;
  }
}
</style>
