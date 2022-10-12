import { Counter as PromCounter } from 'prom-client'
import * as onHeaders from 'on-headers'
import { expressMiddleware } from 'prometheus-api-metrics'

export const apiMetrics = expressMiddleware

export * from 'prom-client'

const normalizeStatusCode = (statusCode) => {
  if (statusCode >= 200 && statusCode < 300) {
    return '2xx'
  }

  if (statusCode >= 300 && statusCode < 400) {
    return '3xx'
  }

  if (statusCode >= 400 && statusCode < 500) {
    return '4xx'
  }

  return '5xx'
}

let requestCount: PromCounter<'method' | 'status' | 'path'>

export const requestTotalsMiddleware = (req, res, next): void => {
  const { method, path } = req

  if (!requestCount) {
    requestCount = new PromCounter({
      name: 'http_requests_total',
      help: 'Total number of http requests',
      labelNames: ['method', 'status', 'path'],
    })
  }

  onHeaders(res, () => {
    const status = normalizeStatusCode(res.statusCode)
    requestCount.inc({ method, status, path })
  })
  next()
}

export const apiMetricMiddlewares = (): Array<any> => [
  expressMiddleware(),
  requestTotalsMiddleware,
]
