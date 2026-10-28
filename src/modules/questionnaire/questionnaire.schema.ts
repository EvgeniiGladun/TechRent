import type { FieldSchema } from '@/modules/dynamic-form/schema'

/**
 * Анкета арендатора. В реальном продукте схема приходит с бэкенда и отличается
 * для разных типов клиентов, поэтому в ней нет функций — только данные.
 */
export const questionnaireSchema: FieldSchema[] = [
  {
    name: 'legal_type',
    component: 'radio',
    label: 'Вы арендуете как',
    required: true,
    options: [
      { value: 'FL', label: 'Физическое лицо' },
      { value: 'IE', label: 'Индивидуальный предприниматель' },
    ],
    extensions: [
      {
        when: ['IE'],
        fields: [
          {
            name: 'inn',
            component: 'text',
            label: 'ИНН',
            required: true,
            pattern: '^\\d{12}$',
            patternMessage: 'ИНН предпринимателя состоит из 12 цифр',
          },
          {
            name: 'ogrnip',
            component: 'text',
            label: 'ОГРНИП',
            required: true,
            pattern: '^\\d{15}$',
            patternMessage: 'ОГРНИП состоит из 15 цифр',
          },
        ],
      },
    ],
  },
  {
    name: 'personal',
    component: 'group',
    label: 'Личные данные',
    fields: [
      { name: 'last_name', component: 'text', label: 'Фамилия', required: true },
      { name: 'first_name', component: 'text', label: 'Имя', required: true },
      { name: 'middle_name', component: 'text', label: 'Отчество', hint: 'Если есть' },
      {
        name: 'birth_date',
        component: 'date',
        label: 'Дата рождения',
        required: true,
        mask: 'date',
      },
      {
        name: 'email',
        component: 'text',
        label: 'Email для документов',
        required: true,
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
        patternMessage: 'Неверный формат email',
        wide: true,
      },
    ],
  },
  {
    name: 'passport',
    component: 'group',
    label: 'Паспорт',
    fields: [
      {
        name: 'passport_number',
        component: 'text',
        label: 'Серия и номер',
        placeholder: '0000 000000',
        required: true,
        pattern: '^\\d{4}\\s?\\d{6}$',
        patternMessage: 'Укажите 4 цифры серии и 6 цифр номера',
      },
      {
        name: 'passport_issued_at',
        component: 'date',
        label: 'Дата выдачи',
        required: true,
        mask: 'date',
      },
    ],
  },
  {
    component: 'group',
    label: 'Профиль арендатора',
    fields: [
      {
        name: 'income_source',
        component: 'select',
        label: 'Основной источник дохода',
        required: true,
        options: [
          { value: 'salary', label: 'Заработная плата' },
          { value: 'business', label: 'Доход от бизнеса' },
          { value: 'savings', label: 'Накопления' },
          { value: 'other', label: 'Другое' },
        ],
        extensions: [
          {
            when: ['other'],
            fields: [
              {
                name: 'income_source_other',
                component: 'text',
                label: 'Уточните источник',
                required: true,
                wide: true,
              },
            ],
          },
        ],
      },
      {
        name: 'planned_amount',
        component: 'text',
        label: 'Планируете арендовать в год на сумму',
        mask: 'amount',
        hint: 'Помогает подобрать технику, ни к чему не обязывает',
      },
      {
        name: 'is_qualified',
        component: 'checkbox',
        label: 'Хочу получить статус проверенного арендатора',
        extensions: [
          {
            when: [true],
            fields: [
              {
                name: 'qualification_basis',
                component: 'select',
                label: 'Основание',
                required: true,
                wide: true,
                options: [
                  { value: 'history', label: 'Аренда без просрочек больше года' },
                  { value: 'license', label: 'Удостоверение машиниста спецтехники' },
                  { value: 'guarantee', label: 'Поручительство компании-работодателя' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    component: 'group',
    label: 'Согласия',
    fields: [
      {
        name: 'agree_rules',
        component: 'checkbox',
        label: 'Ознакомлен с правилами платформы',
        required: true,
      },
      {
        name: 'agree_risks',
        component: 'checkbox',
        label: 'Понимаю, что при просрочке платежей залог может быть удержан',
        required: true,
      },
    ],
  },
]
