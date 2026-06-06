import type { postTemplateKeys } from "@exitpress/domain/export-paths/PostPathTemplate.js"

import { Badge } from "../../components/ui/Badge.js"

import { optionEmbeddedTileClass } from "./OptionControls.js"

const linkTemplateVariableMeta: Record<
  (typeof postTemplateKeys)[number],
  {
    label: string
    description: string
  }
> = {
  slug: {
    label: "{slug}",
    description: "제목을 현재 slug 규칙에 맞춰 바꾼 값입니다.",
  },
  category: {
    label: "{category}",
    description: "카테고리 이름을 현재 slug 규칙에 맞춰 바꾼 값입니다.",
  },
  title: {
    label: "{title}",
    description: "제목만 path-safe 값으로 넣습니다.",
  },
  logNo: {
    label: "{logNo}",
    description: "원본 글 번호를 그대로 넣습니다.",
  },
  blogId: {
    label: "{blogId}",
    description: "현재 export 중인 블로그 ID를 넣습니다.",
  },
  date: {
    label: "{date}",
    description: "발행일을 YYYY-MM-DD 형식으로 넣습니다.",
  },
  year: {
    label: "{year}",
    description: "발행 연도를 4자리로 넣습니다.",
  },
  YYYY: {
    label: "{YYYY}",
    description: "발행 연도를 4자리로 넣습니다.",
  },
  YY: {
    label: "{YY}",
    description: "발행 연도 뒤 2자리만 넣습니다.",
  },
  month: {
    label: "{month}",
    description: "발행 월을 2자리로 넣습니다.",
  },
  MM: {
    label: "{MM}",
    description: "발행 월을 2자리로 넣습니다.",
  },
  M: {
    label: "{M}",
    description: "발행 월을 1~12 숫자로 넣습니다.",
  },
  day: {
    label: "{day}",
    description: "발행 일을 2자리로 넣습니다.",
  },
  DD: {
    label: "{DD}",
    description: "발행 일을 2자리로 넣습니다.",
  },
  D: {
    label: "{D}",
    description: "발행 일을 1~31 숫자로 넣습니다.",
  },
}

export const TemplateVariableCards = ({
  keys,
  values,
  keyPrefix,
  variant = "badge",
}: {
  keys: readonly (typeof postTemplateKeys)[number][]
  values: Partial<Record<(typeof postTemplateKeys)[number], string>>
  keyPrefix?: string
  variant?: "badge" | "inline"
}) => (
  <div className="grid gap-3 md:grid-cols-2">
    {keys.map((key) => {
      const meta = linkTemplateVariableMeta[key]
      const exampleValue = values[key] ?? "-"

      return (
        <div key={keyPrefix ? `${keyPrefix}-${key}` : key} className={optionEmbeddedTileClass}>
          <div className="flex items-center gap-2">
            {variant === "inline" ? (
              <span className="rounded-md bg-[var(--status-running-bg)] px-1.5 py-0.5 font-mono text-sm text-[var(--status-running-fg)]">
                {meta.label}
              </span>
            ) : (
              <Badge variant="outline" className="w-fit rounded-md font-mono text-xs">
                {meta.label}
              </Badge>
            )}
            <span className="text-sm font-medium text-foreground">{meta.description}</span>
          </div>
          <div className="grid gap-1 text-sm leading-6 text-muted-foreground">
            <span>예시 값</span>
            <code className="code-surface break-all px-2 py-1 font-mono text-[0.8125rem] text-foreground">
              {exampleValue}
            </code>
          </div>
        </div>
      )
    })}
  </div>
)
