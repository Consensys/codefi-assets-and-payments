import { ClientResponse } from './ClientResponse'
import { PaginatedResponse } from './PaginatedResponse'

export class ClientGetAllResponse extends PaginatedResponse {
  items: ClientResponse[]
}
