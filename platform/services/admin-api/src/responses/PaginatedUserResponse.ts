import { PaginatedResponse } from './PaginatedResponse'
import { UserCreatedResponse } from './UserCreatedResponse'

export class PaginatedUserResponse extends PaginatedResponse {
  items: UserCreatedResponse[]
}
