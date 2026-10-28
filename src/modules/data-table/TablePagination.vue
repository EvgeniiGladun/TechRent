<template>
  <nav v-if="pages > 1" class="table-pagination" aria-label="Страницы">
    <button
      type="button"
      class="table-pagination__item"
      :disabled="page <= 1"
      aria-label="Предыдущая страница"
      @click="emit('update:page', page - 1)"
    >
      ←
    </button>
    <template v-for="item in items" :key="item.key">
      <span v-if="item.gap" class="table-pagination__gap">…</span>
      <button
        v-else
        type="button"
        class="table-pagination__item"
        :class="{ 'table-pagination__item--active': item.page === page }"
        :aria-current="item.page === page ? 'page' : undefined"
        @click="emit('update:page', item.page)"
      >
        {{ item.page }}
      </button>
    </template>
    <button
      type="button"
      class="table-pagination__item"
      :disabled="page >= pages"
      aria-label="Следующая страница"
      @click="emit('update:page', page + 1)"
    >
      →
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getPageItems } from './pagination'

const props = defineProps<{ page: number; pages: number }>()
const emit = defineEmits<{ 'update:page': [value: number] }>()

const items = computed(() =>
  getPageItems(props.page, props.pages).map((item, index) =>
    item === null
      ? { key: `gap-${index}`, gap: true, page: 0 }
      : { key: item, gap: false, page: item }
  )
)
</script>

<style scoped>
.table-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--gap-4);
}

.table-pagination__item {
  min-width: 36px;
  height: 36px;
  padding: 0 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-s);
  background: var(--color-surface);
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
  cursor: pointer;
}

.table-pagination__item:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.table-pagination__item--active {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: #fff;
}

.table-pagination__gap {
  padding: 0 4px;
  color: var(--color-text-muted);
}
</style>
