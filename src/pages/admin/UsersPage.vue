<template>
  <div class="stack users-page">
    <div class="users-page__head">
      <div>
        <h1>Пользователи</h1>
        <p class="muted">
          {{ data ? `Найдено ${data.total} ${plural(data.total, USER_FORMS)}` : 'Загрузка…' }}
        </p>
      </div>
      <VButton variant="secondary" :disabled="!data?.items.length" @click="exportCsv">
        {{ selected.length ? `Экспорт выбранных (${selected.length})` : 'Экспорт страницы' }}
      </VButton>
    </div>

    <VCard :padded="false" class="users-page__card">
      <div class="users-page__toolbar">
        <VInput
          v-model="search"
          class="users-page__search"
          label="Поиск"
          placeholder="Имя, телефон или email"
        />
        <VButton
          variant="secondary"
          :aria-expanded="isFiltersOpen"
          aria-controls="users-filters"
          @click="isFiltersOpen = !isFiltersOpen"
        >
          Фильтры
          <span v-if="activeFiltersCount" class="users-page__badge">{{ activeFiltersCount }}</span>
        </VButton>
      </div>

      <Transition name="fade">
        <div v-if="isFiltersOpen" id="users-filters" class="users-page__filters">
          <VSelect v-model="filters.role" label="Роль" :options="userRole.options()" />
          <VSelect v-model="filters.legal_type" label="Тип лица" :options="legalType.options()" />
          <VSelect
            v-model="filters.verification"
            label="Верификация"
            :options="verification.options()"
          />
          <VSelect
            v-model="filters.status"
            label="Статус"
            :options="Object.values(USER_STATUS_FILTER)"
          />
          <div class="users-page__range">
            <VInput v-model="balanceFrom" label="Баланс от" mask="amount" suffix="₽" />
            <VInput v-model="balanceTo" label="до" mask="amount" suffix="₽" />
          </div>
          <VButton variant="ghost" :disabled="!activeFiltersCount" @click="resetFilters">
            Сбросить
          </VButton>
        </div>
      </Transition>

      <Transition name="fade">
        <div v-if="selected.length" class="users-page__bulk" role="region" aria-label="Действия">
          <span>Выбрано: {{ selected.length }}</span>
          <VButton variant="secondary" :loading="isBlocking" @click="setBlocked(true)">
            Заблокировать
          </VButton>
          <VButton variant="secondary" :loading="isBlocking" @click="setBlocked(false)">
            Разблокировать
          </VButton>
          <VButton variant="ghost" @click="selected = []">Снять выбор</VButton>
        </div>
      </Transition>

      <VAlert v-if="bulkError" variant="danger" class="users-page__alert">{{ bulkError }}</VAlert>

      <VSkeleton v-if="isPending" height="320px" radius="0" />
      <VAlert v-else-if="isError" variant="danger" class="users-page__alert">
        Не удалось загрузить пользователей
      </VAlert>
      <DataTable
        v-else-if="data"
        v-model:sort="sort"
        v-model:selected="selected"
        :rows="data.items"
        :columns="columns"
        row-key="id"
        selectable
        :loading="isFetching"
        :row-class="row => (row.is_blocked ? 'users-page__row--blocked' : undefined)"
      >
        <template #cell-name="{ row }">
          <span class="users-page__name">
            {{ row.name }}
            <span v-if="row.is_blocked" class="users-page__tag">заблокирован</span>
          </span>
        </template>
        <template #cell-verification="{ row }">
          <span class="users-page__status" :class="`users-page__status--${row.verification}`">
            {{ verification.textOf(row.verification) }}
          </span>
        </template>
        <template #empty>
          Никого не нашли.
          <button
            v-if="activeFiltersCount || search"
            type="button"
            class="users-page__link"
            @click="clearAll"
          >
            Сбросить поиск и фильтры
          </button>
        </template>
      </DataTable>

      <div v-if="data && data.pages > 1" class="users-page__footer">
        <span class="small muted">Страница {{ data.page }} из {{ data.pages }}</span>
        <TablePagination v-model:page="page" :pages="data.pages" />
      </div>
    </VCard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAdminUsersQuery, useBlockUsersMutation } from '@/api/queries'
import type { User } from '@/api/schemas'
import { legalType, qualification, userRole, verification } from '@/utils/dictionaries'
import { formatAmountInput, formatCurrency, parseAmount, plural } from '@/utils/format'
import { processError } from '@/utils/error'
import { useTableQuery } from '@/modules/data-table/useTableQuery'
import type { RangeFilter } from '@/modules/data-table/table-query'
import { downloadCsv, toCsv } from '@/modules/data-table/csv'
import { USERS_TABLE_FILTERS, USER_STATUS_FILTER } from '@/modules/admin-users/users-table'
import DataTable, { type TableColumn } from '@/modules/data-table/DataTable.vue'
import TablePagination from '@/modules/data-table/TablePagination.vue'
import VAlert from '@/components/ui/VAlert.vue'
import VButton from '@/components/ui/VButton.vue'
import VCard from '@/components/ui/VCard.vue'
import VInput from '@/components/ui/VInput.vue'
import VSelect from '@/components/ui/VSelect.vue'
import VSkeleton from '@/components/ui/VSkeleton.vue'

const USER_FORMS = ['пользователь', 'пользователя', 'пользователей'] as const

const columns: TableColumn<User>[] = [
  { key: 'name', label: 'Имя', sortable: true },
  { key: 'phone', label: 'Телефон' },
  { key: 'role', label: 'Роль', value: row => userRole.textOf(row.role) },
  { key: 'legal_type', label: 'Тип', value: row => legalType.textOf(row.legal_type) },
  { key: 'verification', label: 'Верификация' },
  {
    key: 'rented_this_year',
    label: 'Арендовано за год',
    sortable: true,
    align: 'right',
    value: row => formatCurrency(row.rented_this_year),
  },
  {
    key: 'balance',
    label: 'Баланс',
    sortable: true,
    align: 'right',
    value: row => formatCurrency(row.balance),
  },
]

const { search, filters, sort, page, query, activeFiltersCount, resetFilters } = useTableQuery({
  filters: USERS_TABLE_FILTERS,
})

const { data, isPending, isError, isFetching } = useAdminUsersQuery(query)
const { mutateAsync: blockUsers, isPending: isBlocking } = useBlockUsersMutation()

const isFiltersOpen = ref(activeFiltersCount.value > 0)
const selected = ref<string[]>([])
const bulkError = ref('')

/** Поля «от/до» работают с маской суммы, а в фильтр уходит число */
const rangeField = (range: RangeFilter, edge: keyof RangeFilter) =>
  computed({
    get: () => (range[edge] != null ? formatAmountInput(range[edge]) : ''),
    set: input => {
      const amount = parseAmount(input)
      range[edge] = Number.isNaN(amount) ? null : amount
    },
  })

const balanceFrom = rangeField(filters.balance, 'from')
const balanceTo = rangeField(filters.balance, 'to')

const clearAll = () => {
  search.value = ''
  resetFilters()
}

const setBlocked = async (blocked: boolean) => {
  bulkError.value = ''
  try {
    await blockUsers({ ids: selected.value, blocked })
    selected.value = []
  } catch (error) {
    bulkError.value = processError(error).message
  }
}

const exportCsv = () => {
  const rows = data.value?.items ?? []
  const target = selected.value.length ? rows.filter(row => selected.value.includes(row.id)) : rows

  const csv = toCsv(target, [
    { label: 'ID', value: row => row.id },
    { label: 'Имя', value: row => row.name },
    { label: 'Телефон', value: row => row.phone },
    { label: 'Email', value: row => row.email },
    { label: 'Роль', value: row => userRole.textOf(row.role) },
    { label: 'Тип лица', value: row => legalType.textOf(row.legal_type) },
    { label: 'Статус арендатора', value: row => qualification.textOf(row.qualification) },
    { label: 'Верификация', value: row => verification.textOf(row.verification) },
    { label: 'Баланс', value: row => row.balance },
    { label: 'Заблокирован', value: row => (row.is_blocked ? 'да' : 'нет') },
  ])
  downloadCsv(`users-${new Date().toISOString().slice(0, 10)}.csv`, csv)
}
</script>

<style scoped>
.users-page {
  gap: var(--gap-24);
}

.users-page__head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-end;
  gap: var(--gap-16);
}

.users-page__card {
  overflow: hidden;
}

.users-page__toolbar {
  display: flex;
  align-items: flex-end;
  gap: var(--gap-12);
  padding: var(--gap-16);
}

.users-page__search {
  flex: 1;
}

.users-page__badge {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--color-accent);
  color: #fff;
  font-size: 12px;
  line-height: 20px;
}

.users-page__filters {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  align-items: end;
  gap: var(--gap-12);
  padding: 0 var(--gap-16) var(--gap-16);
}

.users-page__range {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--gap-8);
  grid-column: span 2;
}

.users-page__bulk {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--gap-8);
  padding: var(--gap-8) var(--gap-16);
  background: var(--color-accent-soft);
  border-top: 1px solid var(--color-border);
  font-weight: 550;
}

.users-page__bulk > span {
  margin-right: auto;
}

.users-page__alert {
  margin: 0 var(--gap-16) var(--gap-16);
}

.users-page__footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--gap-12);
  padding: var(--gap-16);
  border-top: 1px solid var(--color-border);
}

.users-page__name {
  font-weight: 550;
}

:deep(.users-page__row--blocked) td {
  color: var(--color-text-muted);
}

.users-page__tag {
  margin-left: var(--gap-8);
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--color-danger-soft);
  color: var(--color-danger);
  font-size: 12px;
  font-weight: 400;
}

.users-page__status {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--color-surface-muted);
  font-size: 13px;
}

.users-page__status--C {
  background: var(--color-success-soft);
  color: var(--color-success);
}

.users-page__status--P {
  background: var(--color-warning-soft);
  color: var(--color-warning);
}

.users-page__status--R {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

.users-page__link {
  border: 0;
  background: none;
  color: var(--color-accent);
  font: inherit;
  cursor: pointer;
}

@media (max-width: 720px) {
  .users-page__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .users-page__range {
    grid-column: auto;
  }
}
</style>
