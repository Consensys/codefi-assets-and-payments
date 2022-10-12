import { Scope } from '../requests/ResourceServerApiRequest'

export class CreateApiResponse {
  id: string
  name: string
  identifier: string
  scopes: Scope[]
  token_lifetime: number
  token_dialect: string
  skip_consent_for_verifiable_first_party_clients: boolean
  enforce_policies: boolean
}
