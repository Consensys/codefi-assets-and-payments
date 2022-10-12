import { ProviderAuth } from '../types/ProviderAuth'

export const wrapProvider = (providerUrl: string): ProviderAuth => {
  const noHttpsProviderUrl = providerUrl.replace('https://', '')

  const provider = noHttpsProviderUrl.split(/:|@/)

  const providerAuth: ProviderAuth = {
    user: provider[0],
    password: provider[1],
    url: `https://${provider[2]}`,
  }

  return providerAuth
}

export const unwrapProvider = (providerAuth: ProviderAuth): string => {
  const noHttpsProviderUrl = providerAuth.url.replace('https://', '')

  return `https://${providerAuth.user}:${providerAuth.password}@${noHttpsProviderUrl}`
}
