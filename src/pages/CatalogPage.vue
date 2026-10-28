<template>
  <div class="stack catalog-page">
    <div class="catalog-page__head">
      <div>
        <h1>Каталог техники</h1>
        <p class="muted">Спецтехника в аренду с правом выкупа и ежемесячными платежами</p>
      </div>
      <div class="catalog-page__filters" role="tablist" aria-label="Фильтр техники">
        <button
          v-for="filter in FILTERS"
          :key="filter.value"
          type="button"
          role="tab"
          class="catalog-page__filter"
          :class="{ 'catalog-page__filter--active': activeFilter === filter.value }"
          :aria-selected="activeFilter === filter.value"
          @click="activeFilter = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <VAlert v-if="isError" variant="danger">
      Не удалось загрузить каталог. Обновите страницу.
    </VAlert>

    <div v-else class="catalog-page__grid">
      <template v-if="isPending">
        <VSkeleton v-for="index in 3" :key="index" height="260px" radius="20px" />
      </template>
      <EquipmentCard v-for="item in filteredEquipment" v-else :key="item.id" :equipment="item" />
    </div>

    <p v-if="!isPending && !isError && !filteredEquipment.length" class="muted">
      Техники в этой категории нет
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEquipmentListQuery } from '@/api/queries'
import { equipmentStatus } from '@/utils/dictionaries'
import EquipmentCard from '@/components/EquipmentCard.vue'
import VAlert from '@/components/ui/VAlert.vue'
import VSkeleton from '@/components/ui/VSkeleton.vue'

type Filter = 'active' | 'all'

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'active', label: 'В наличии' },
  { value: 'all', label: 'Все' },
]

const activeFilter = ref<Filter>('active')
const { data: catalog, isPending, isError } = useEquipmentListQuery()

const filteredEquipment = computed(() => {
  const list = catalog.value ?? []
  return activeFilter.value === 'active'
    ? list.filter(item => equipmentStatus.is(item.status, 'AVAILABLE'))
    : list
})
</script>

<style scoped>
.catalog-page {
  gap: var(--gap-24);
}

.catalog-page__head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-end;
  gap: var(--gap-16);
}

.catalog-page__filters {
  display: flex;
  gap: var(--gap-4);
  padding: 4px;
  border-radius: var(--radius-m);
  background: var(--color-surface-muted);
}

.catalog-page__filter {
  padding: 6px 14px;
  border: 0;
  border-radius: var(--radius-s);
  background: none;
  color: var(--color-text-muted);
  font-weight: 550;
  cursor: pointer;
}

.catalog-page__filter--active {
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-card);
}

.catalog-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--gap-16);
}
</style>
