import { Request } from 'express'
import jwt from 'jsonwebtoken'
import { JwtToken, FullJwtToken } from '../guards/JwtToken'

export const DECODED_TOKEN_HEADER = 'decodedToken'

export const decodeToken = (request: Request): JwtToken | undefined => {
  const headers = request.headers
  if (headers.authorization) {
    const bearerToken = headers.authorization
    const bearerTokenArray = bearerToken.split(' ')
    if (bearerTokenArray.length < 2) {
      return
    }
    const decodedToken: JwtToken = jwt.decode(bearerTokenArray[1]) as JwtToken
    return decodedToken
  }
}

export const decodeFullToken = (token: string): FullJwtToken => {
  const decodedToken: FullJwtToken = jwt.decode(token) as FullJwtToken
  return decodedToken
}

export const tokenFromRequest = (request: Request): JwtToken => {
  const decodedToken: JwtToken = request.headers[
    DECODED_TOKEN_HEADER
  ] as unknown as JwtToken
  return decodedToken
}
