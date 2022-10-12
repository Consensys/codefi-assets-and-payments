import crypto from 'crypto'
import { createLogger } from '@codefi-assets-and-payments/observability/dist'
import { BadRequestException } from '@nestjs/common'

const logger = createLogger('api-utils')

const SHA_256 = 'sha256'

/**
 * Validates if a request has a valid HMAC signature.
 *
 * @param rawBody the original body of the request
 * @param key key used to sign a request
 * @param actualHmac HMAC signature sent with the request
 */
export function verifySHA256Signature(
  rawBody: Buffer,
  key: string,
  actualHmac: string | undefined,
): void {
  if (!actualHmac) {
    logger.error('Received a request without an HMAC signature')
    throw new BadRequestException('Invalid request')
  }

  const onFidoHmacChecker = crypto.createHmac(SHA_256, key)
  onFidoHmacChecker.write(rawBody)
  const expectedHmac = onFidoHmacChecker.digest('hex')

  if (expectedHmac !== actualHmac) {
    logger.error(
      {
        actualHmac,
        expectedHmac,
      },
      'Received a request with an invalid HMAC signature',
    )
    throw new BadRequestException('Invalid request')
  }
}
