// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { UploadProviderOptionsStep } from "./UploadProviderOptionsStep.js"

describe("UploadProviderOptionsStep", () => {
  it("shows the blocked next-step message", () => {
    render(
      <UploadProviderOptionsStep
        uploadProviders={{ defaultProviderKey: null, providers: [] }}
        uploadProviderError={null}
        stepMessage="이미지 업로드 설정을 먼저 입력해야 합니다."
        testUploadSubmitting={false}
        testUploadResult={null}
        testUploadError={null}
        onChange={vi.fn()}
        onReadyChange={vi.fn()}
        onTestUpload={vi.fn()}
      />,
    )

    expect(screen.getByText("이미지 업로드 설정을 먼저 입력해야 합니다.")).toBeInTheDocument()
  })
})
