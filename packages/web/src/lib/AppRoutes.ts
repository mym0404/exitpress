export const allAppRoutes = ["export", "storybook"] as const
type AppRoute = (typeof allAppRoutes)[number]

const storybookPathname = "/storybook"

const normalizeBasePath = (basePath: string) => {
  if (!basePath || basePath === ".") {
    return "/"
  }

  const leadingBasePath = basePath.startsWith("/") ? basePath : `/${basePath}`

  return leadingBasePath.endsWith("/") ? leadingBasePath : `${leadingBasePath}/`
}

const trimTrailingSlash = (value: string) => (value.length > 1 ? value.replace(/\/+$/, "") : value)

const isStorybookOnlyBasePath = (basePath: string) => {
  const normalizedBasePath = normalizeBasePath(basePath)

  return (
    normalizedBasePath !== "/" && trimTrailingSlash(normalizedBasePath).endsWith(storybookPathname)
  )
}

const getAppPathname = ({ pathname, basePath }: { pathname: string; basePath: string }) => {
  const normalizedBasePath = normalizeBasePath(basePath)

  if (
    isStorybookOnlyBasePath(normalizedBasePath) &&
    (pathname === normalizedBasePath || pathname === trimTrailingSlash(normalizedBasePath))
  ) {
    return storybookPathname
  }

  return pathname
}

export const getAppRoute = ({
  pathname,
  basePath,
}: {
  pathname: string
  basePath: string
}): AppRoute =>
  getAppPathname({
    pathname,
    basePath,
  }) === storybookPathname
    ? "storybook"
    : "export"

export const createAppHref = ({ pathname, basePath }: { pathname: string; basePath: string }) => {
  const normalizedBasePath = normalizeBasePath(basePath)

  if (normalizedBasePath === "/") {
    return pathname
  }

  if (isStorybookOnlyBasePath(normalizedBasePath) && pathname === storybookPathname) {
    return normalizedBasePath
  }

  return `${trimTrailingSlash(normalizedBasePath)}${pathname}`
}

export const shouldShowStorybookBackLink = (basePath: string) => !isStorybookOnlyBasePath(basePath)
