export interface ConfiguredRole {
  name: string
  description: string
  permissions: ConfiguredPermission[]
}

export interface ConfiguredPermission {
  value: string
  description: string
}
