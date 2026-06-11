import type { BlogProvider } from "./BlogProvider.js"

export type ProviderRegistry = {
  list: () => BlogProvider[]
  get: (key: string) => BlogProvider | undefined
  require: (key: string) => BlogProvider
}

export const createProviderRegistry = (providers: BlogProvider[]): ProviderRegistry => {
  const providerByKey = new Map<string, BlogProvider>()

  providers.forEach((provider) => {
    if (providerByKey.has(provider.key)) {
      throw new Error(`Duplicate blog provider key: ${provider.key}`)
    }

    providerByKey.set(provider.key, provider)
  })

  return {
    list: () => [...providerByKey.values()],
    get: (key) => providerByKey.get(key),
    require: (key) => {
      const provider = providerByKey.get(key)

      if (!provider) {
        throw new Error(`Unknown blog provider key: ${key}`)
      }

      return provider
    },
  }
}
