export class GetClientGrantResponse {
  grants: ClientGrant[]
}

export class ClientGrant {
  id: string
  clientId: string
  audience: string
  scope: string[]
}
