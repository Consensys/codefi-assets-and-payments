import { Request } from 'express'
import { JwtToken } from '../requests/JwtToken'
import jwt from 'jsonwebtoken'

export const DECODED_TOKEN_HEADER = 'decodedToken'

export const decodeToken = (request: Request): JwtToken | undefined => {
  const headers = request.headers
  if (headers.authorization) {
    const bearerToken = headers.authorization
    const bearerTokenArray = bearerToken.split(' ')
    if (bearerTokenArray.length < 2) {
      return undefined
    }
    const decodedToken: JwtToken = jwt.decode(bearerTokenArray[1]) as any
    return decodedToken
  }
}

export const tokenFromRequest = (request: Request): JwtToken => {
  const decodedToken: JwtToken = request.headers[
    DECODED_TOKEN_HEADER
  ] as unknown as JwtToken
  return decodedToken
}
