import {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { routes, type MockRequest } from './handlers'
import { MockHttpError } from './http-error'

const LATENCY_MS = import.meta.env.MODE === 'test' ? 0 : 350

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const matchRoute = (method: string, url: string) => {
  for (const route of routes) {
    if (route.method !== method) continue
    const match = url.match(route.pattern)
    if (match) return { route, params: match.groups ?? {} }
  }
  return null
}

const buildResponse = (
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown
): AxiosResponse => ({
  data,
  status,
  statusText: String(status),
  headers: new AxiosHeaders({ 'content-type': 'application/json' }),
  config,
})

export const mockAdapter: AxiosAdapter = async config => {
  await delay(LATENCY_MS)

  const method = (config.method ?? 'get').toUpperCase()
  const url = (config.url ?? '').split('?')[0] ?? ''
  const found = matchRoute(method, url)

  if (!found) {
    const response = buildResponse(config, 404, { message: `Mock: ${method} ${url} не найден` })
    throw new AxiosError('Not Found', 'ERR_BAD_REQUEST', config, null, response)
  }

  const request: MockRequest = {
    params: found.params,
    body: typeof config.data === 'string' && config.data ? JSON.parse(config.data) : {},
    token: String(config.headers.Authorization ?? '').replace(/^Bearer /, '') || null,
  }

  try {
    const { status = 200, data = null } = (await found.route.handler(request)) ?? {}
    return buildResponse(config, status, data)
  } catch (error) {
    if (!(error instanceof MockHttpError)) throw error

    const response = buildResponse(config, error.status, error.body)
    const code = error.status >= 500 ? 'ERR_BAD_RESPONSE' : 'ERR_BAD_REQUEST'
    throw new AxiosError(error.message, code, config, null, response)
  }
}
