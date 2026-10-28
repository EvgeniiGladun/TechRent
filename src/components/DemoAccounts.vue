<template>
  <details class="demo-accounts">
    <summary>Демо-аккаунты</summary>
    <p class="muted small">
      Пароль у всех
      <code>{{ DEMO_PASSWORD }}</code>
      · код из СМС
      <code>{{ DEMO_CODE }}</code>
    </p>
    <ul class="demo-accounts__list">
      <li v-for="account in accounts" :key="account.phone">
        <button
          type="button"
          class="demo-accounts__item"
          @click="emit('pick', account.phone, DEMO_PASSWORD)"
        >
          <span class="tabular">{{ account.phone }}</span>
          <span class="muted small">{{ account.note }}</span>
        </button>
      </li>
    </ul>
  </details>
</template>

<script setup lang="ts">
import { DEMO_CODE, DEMO_PASSWORD } from '@/api/mock/db'

const emit = defineEmits<{ pick: [phone: string, password: string] }>()

const accounts = [
  { phone: '+7 (900) 000-00-01', note: 'Физлицо, лимит аренды 600 тыс./год' },
  { phone: '+7 (900) 000-00-02', note: 'Юрлицо, без годового лимита' },
  { phone: '+7 (900) 000-00-03', note: 'Администратор' },
  { phone: '+7 (900) 000-00-04', note: 'Заблокирован' },
  { phone: '+7 (900) 000-00-05', note: 'Не прошёл верификацию' },
]
</script>

<style scoped>
.demo-accounts {
  padding: 12px 14px;
  border-radius: var(--radius-m);
  background: var(--color-surface-muted);
  font-size: 14px;
}

.demo-accounts summary {
  cursor: pointer;
  font-weight: 600;
}

.demo-accounts p {
  margin-top: var(--gap-8);
}

.demo-accounts__list {
  margin: var(--gap-8) 0 0;
  padding: 0;
  list-style: none;
}

.demo-accounts__item {
  display: flex;
  justify-content: space-between;
  gap: var(--gap-8);
  width: 100%;
  padding: 6px 8px;
  border: 0;
  border-radius: var(--radius-s);
  background: none;
  text-align: left;
  cursor: pointer;
}

.demo-accounts__item:hover {
  background: var(--color-surface);
}
</style>
