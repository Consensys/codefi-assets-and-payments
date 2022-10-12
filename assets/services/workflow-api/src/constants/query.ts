export const LIMIT = 100

export interface Field {
  name: string
  comparator: '=' | '<' | '>' | '!'
  value: string | string[]
}

export interface SortCriteria {
  [key: string]: 'DESC' | 'ASC'
}

export interface V2QueryOptions {
  callerId: string
  isInvestorQuery?: boolean
}

export interface FindAllOptions {
  tenantId: string
  fields: Field[]
  options: {
    skip: number
    limit: number
    order: SortCriteria[]
  }
  queryOption?: V2QueryOptions
}

export interface Paginate<T> {
  items: T[]
  total: number
}
