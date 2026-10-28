<template>
  <div class="stack questionnaire-page">
    <div>
      <h1>Анкета арендатора</h1>
      <p class="muted">
        Форма строится по JSON-схеме: поля, условия показа и правила проверки описаны данными
      </p>
    </div>

    <VCard v-if="sentPayload">
      <div class="stack">
        <VAlert variant="success" title="Анкета отправлена на проверку">
          Статус верификации: «{{ verification.textOf(status) }}».
        </VAlert>
        <p class="small muted">Данные, которые ушли на бэкенд:</p>
        <pre class="questionnaire-page__payload">{{ JSON.stringify(sentPayload, null, 2) }}</pre>
        <VButton variant="secondary" @click="sentPayload = null">Заполнить ещё раз</VButton>
      </div>
    </VCard>

    <VCard v-else>
      <VAlert v-if="bannerMessage" variant="danger" class="questionnaire-page__alert">
        {{ bannerMessage }}
      </VAlert>
      <DynamicForm
        :schema="questionnaireSchema"
        :submitting="isPending"
        :server-errors="fieldErrors"
        submit-text="Отправить на проверку"
        @submit="onSubmit"
      />
    </VCard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuestionnaireMutation } from '@/api/queries'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { verification } from '@/utils/dictionaries'
import { useUserStore } from '@/stores/user'
import type { Payload } from '@/modules/dynamic-form/schema'
import { questionnaireSchema } from '@/modules/questionnaire/questionnaire.schema'
import DynamicForm from '@/modules/dynamic-form/DynamicForm.vue'
import VAlert from '@/components/ui/VAlert.vue'
import VButton from '@/components/ui/VButton.vue'
import VCard from '@/components/ui/VCard.vue'

const sentPayload = ref<Payload | null>(null)
const status = ref<string | null>(null)
const userStore = useUserStore()

const { mutateAsync, isPending } = useQuestionnaireMutation()
const { errorMessage, fieldErrors, handleError, clearError } = useErrorHandler({
  context: 'Questionnaire',
})

// Ошибки по полям показываются под самими полями, общий баннер — только для остальных
const bannerMessage = computed(() =>
  Object.keys(fieldErrors.value).length ? '' : errorMessage.value
)

const onSubmit = async (payload: Payload) => {
  clearError()
  try {
    const result = await mutateAsync(payload)
    // Статус верификации в шапке и в проверках перед арендой должен обновиться сразу
    await userStore.load(true)
    status.value = result.verification
    sentPayload.value = payload
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (error) {
    handleError(error)
  }
}
</script>

<style scoped>
.questionnaire-page {
  gap: var(--gap-24);
  max-width: 820px;
}

.questionnaire-page__alert {
  margin-bottom: var(--gap-24);
}

.questionnaire-page__payload {
  margin: 0;
  padding: var(--gap-16);
  border-radius: var(--radius-m);
  background: var(--color-surface-muted);
  font-size: 13px;
  overflow-x: auto;
}
</style>
