<template>
  <AuthCard :title="title" :subtitle="phone ? `Отправили код на ${maskPhone(phone)}` : undefined">
    <form class="stack" novalidate @submit.prevent="submit()">
      <VOtpInput
        v-model="code"
        :length="OTP.LENGTH"
        :error="codeError"
        :disabled="isLoading"
        @complete="submit"
      />

      <VButton type="submit" block :loading="isLoading">Подтвердить</VButton>

      <VButton variant="secondary" block :disabled="cooldown.isActive.value" @click="resend">
        <template v-if="cooldown.isActive.value">
          Отправить повторно через
          <span class="tabular">{{ cooldown.formatted.value }}</span>
        </template>
        <template v-else>Отправить код повторно</template>
      </VButton>
    </form>

    <p class="muted small">
      Три неверных попытки — блокировка до повторной отправки. Демо-код:
      <code>{{ DEMO_CODE }}</code>
    </p>

    <template #footer>
      <VButton variant="ghost" @click="router.back()">← Назад</VButton>
    </template>
  </AuthCard>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { OTP } from '@/constants'
import { DEMO_CODE } from '@/api/mock/db'
import { maskPhone } from '@/utils/format'
import { useConfirmFlow } from '@/modules/auth/useConfirmFlow'
import AuthCard from '@/components/AuthCard.vue'
import VButton from '@/components/ui/VButton.vue'
import VOtpInput from '@/components/ui/VOtpInput.vue'

const router = useRouter()
const { title, phone, code, codeError, isLoading, cooldown, submit, resend } = useConfirmFlow()
</script>
