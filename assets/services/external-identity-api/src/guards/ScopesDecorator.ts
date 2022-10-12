import { SetMetadata } from '@nestjs/common'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const Scopes = (...scopes: string[]) => SetMetadata('scopes', scopes)
