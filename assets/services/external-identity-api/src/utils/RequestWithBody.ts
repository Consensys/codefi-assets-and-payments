import { Request } from 'express'

export default interface RequestWithBody extends Request {
  rawBody: Buffer
}
