export type SupportUnitFailureGroup = {
  supportUnitKey: string
  failureBlockHash?: string
  editorType?: string | null
  firstUnsupportedPath?: string | null
  firstUnsupportedTag?: string | null
  representative?: {
    postId: string
    title?: string
    source?: string
    inspectReportPath?: string | null
  }
  postIds: string[]
}

const mergeOptionalGroupMetadata = ({
  current,
  next,
}: {
  current: SupportUnitFailureGroup
  next: SupportUnitFailureGroup
}) => ({
  failureBlockHash: current.failureBlockHash ?? next.failureBlockHash,
  editorType: current.editorType ?? next.editorType,
  firstUnsupportedPath: current.firstUnsupportedPath ?? next.firstUnsupportedPath,
  firstUnsupportedTag: current.firstUnsupportedTag ?? next.firstUnsupportedTag,
  representative: current.representative ?? next.representative,
})

export const mergeSupportUnitFailureGroups = (groups: SupportUnitFailureGroup[]) => {
  const merged = new Map<string, SupportUnitFailureGroup>()

  for (const group of groups) {
    const current = merged.get(group.supportUnitKey)

    if (!current) {
      merged.set(group.supportUnitKey, {
        supportUnitKey: group.supportUnitKey,
        ...mergeOptionalGroupMetadata({
          current: group,
          next: group,
        }),
        postIds: [...new Set(group.postIds)],
      })
      continue
    }

    merged.set(group.supportUnitKey, {
      supportUnitKey: group.supportUnitKey,
      ...mergeOptionalGroupMetadata({
        current,
        next: group,
      }),
      postIds: [...new Set([...current.postIds, ...group.postIds])],
    })
  }

  return [...merged.values()]
}

export const selectFocusedSupportUnit = <Group extends SupportUnitFailureGroup>({
  failureGroups,
  previousFailureGroups,
  focusSupportUnit,
}: {
  failureGroups: Group[]
  previousFailureGroups: SupportUnitFailureGroup[]
  focusSupportUnit?: string
}) => {
  if (!focusSupportUnit) {
    return {
      reportFailureGroups: failureGroups,
      remainingBacklogGroups: [],
      previousFocusedGroups: [],
      previousFocusedPostIds: [],
      focusedFailureBlockHash: undefined,
      focusedSupportUnitKnown: true,
      focusedSupportUnitResolved: null,
    }
  }

  const reportFailureGroups = failureGroups.filter(
    (group) => group.supportUnitKey === focusSupportUnit,
  )
  const remainingBacklogGroups = failureGroups.filter(
    (group) => group.supportUnitKey !== focusSupportUnit,
  )
  const previousFocusedGroups = previousFailureGroups.filter(
    (group) => group.supportUnitKey === focusSupportUnit,
  )
  const previousFocusedPostIds = previousFailureGroups
    .filter((group) => group.supportUnitKey === focusSupportUnit)
    .flatMap((group) => group.postIds)
  const focusedSupportUnitKnown =
    reportFailureGroups.length > 0 || previousFocusedPostIds.length > 0
  const focusedFailureBlockHash =
    reportFailureGroups.find((group) => group.failureBlockHash)?.failureBlockHash ??
    previousFailureGroups.find((group) => group.supportUnitKey === focusSupportUnit)
      ?.failureBlockHash

  return {
    reportFailureGroups,
    remainingBacklogGroups,
    previousFocusedGroups,
    previousFocusedPostIds,
    focusedFailureBlockHash,
    focusedSupportUnitKnown,
    focusedSupportUnitResolved: focusedSupportUnitKnown ? reportFailureGroups.length === 0 : false,
  }
}
