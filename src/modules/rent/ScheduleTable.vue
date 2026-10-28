<template>
  <details class="schedule" :open="schedule.rows.length <= 6">
    <summary>
      График платежей · {{ schedule.rows.length }}
      {{ plural(schedule.rows.length, ['платёж', 'платежа', 'платежей']) }}
    </summary>
    <div class="schedule__scroll">
      <table class="schedule__table tabular">
        <thead>
          <tr>
            <th scope="col">Месяц</th>
            <th scope="col">Выкуп</th>
            <th scope="col">Аренда</th>
            <th scope="col">Платёж</th>
            <th scope="col">Остаток</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in schedule.rows" :key="row.month">
            <td>{{ row.month }}</td>
            <td>{{ formatCurrency(row.buyout) }}</td>
            <td>{{ formatCurrency(row.rent) }}</td>
            <td>{{ formatCurrency(row.payment) }}</td>
            <td>{{ formatCurrency(row.remaining) }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Итого</th>
            <td>{{ formatCurrency(schedule.totalPayment - schedule.totalRent) }}</td>
            <td>{{ formatCurrency(schedule.totalRent) }}</td>
            <td>{{ formatCurrency(schedule.totalPayment) }}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
    <p class="muted small">
      Предварительный расчёт. Итоговый график формируется при подписании договора аренды.
    </p>
  </details>
</template>

<script setup lang="ts">
import { formatCurrency, plural } from '@/utils/format'
import type { Schedule } from './schedule'

defineProps<{ schedule: Schedule }>()
</script>

<style scoped>
.schedule summary {
  cursor: pointer;
  font-weight: 600;
}

.schedule__scroll {
  overflow-x: auto;
  margin: var(--gap-12) 0 var(--gap-8);
}

.schedule__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  white-space: nowrap;
}

.schedule__table th,
.schedule__table td {
  padding: 6px 8px;
  text-align: right;
  border-bottom: 1px solid var(--color-border);
}

.schedule__table th:first-child,
.schedule__table td:first-child {
  text-align: left;
}

.schedule__table thead th {
  color: var(--color-text-muted);
  font-weight: 550;
}

.schedule__table tfoot {
  font-weight: 650;
}
</style>
