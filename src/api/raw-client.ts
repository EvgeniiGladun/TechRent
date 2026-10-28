import axios, { type CreateAxiosDefaults } from 'axios'
import { mockAdapter } from './mock/adapter'

const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

export const clientConfig: CreateAxiosDefaults = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
  ...(useMock && { adapter: mockAdapter }),
}

export const rawClient = axios.create(clientConfig)
