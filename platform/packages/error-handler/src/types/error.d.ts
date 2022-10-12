export interface Error {
  statusCode: number
  message: string
  timestamp?: string
  path?: string
  stack?: string
}
