import { describe, expect, it } from "vitest"

import { createHttpServer } from "./HttpServer.js"

describe("http server composition", () => {
  it("creates a node http server", () => {
    const server = createHttpServer()

    expect(server.listening).toBe(false)
    server.close()
  })
})
