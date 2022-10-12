import { HttpStatus, HttpException } from '@nestjs/common'

/**
 * [Check if tenantId is correct]
 */
export const checkTenantId = (tenantId1: string, tenantId2: string) => {
  if (!(tenantId1 && tenantId2 && tenantId1 === tenantId2)) {
    const error = 'invalid tenantId'
    throw new HttpException(
      {
        status: HttpStatus.BAD_REQUEST,
        error,
      },
      HttpStatus.BAD_REQUEST,
    )
  }
}

/**
 * [Check if tenantId is defined]
 */
export const requireTenantId = (tenantId: string) => {
  if (!tenantId) {
    const error = 'tenantId can not be undefined'
    throw new HttpException(
      {
        status: HttpStatus.BAD_REQUEST,
        error,
      },
      HttpStatus.BAD_REQUEST,
    )
  }
}
