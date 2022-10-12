import { BaseExceptionResponse } from './BaseExceptionResponse'

export const errorApiResponse = (statusCode: number, errorCodes: string[]) => ({
  type: BaseExceptionResponse,
  status: statusCode,
  description: `<b>errorCode</b> <br /><ul>${errorCodes.map(
    (errorCode) => `<li><code>${errorCode}</code></li>`,
  )}</ul>`,
})
