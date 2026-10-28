export const regex = {
  phone: /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/,
  email: /^(?!.*\.\.)(?!.*@.*@)[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+(?:[.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/,
  strongPassword: /^(?=.*[A-ZА-ЯЁ])(?=.*[a-zа-яё])(?=.*\d)(?=.*[^\p{L}\d\s]).+$/u,
  digits: /\D/g,
} as const
