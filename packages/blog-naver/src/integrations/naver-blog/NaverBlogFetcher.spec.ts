import { afterEach, describe, expect, it, vi } from "vitest"

import { NaverBlogFetcher } from "./NaverBlogFetcher.js"

describe("NaverBlogFetcher", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("retries getPostCount after an aborted request", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementationOnce((_, init) => {
        return new Promise<Response>((_, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Request timed out", "AbortError"))
          })
        })
      })
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            result: {
              postCount: 12,
            },
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      )

    vi.stubGlobal("fetch", fetchMock)

    const fetcher = new NaverBlogFetcher({
      blogId: "mym0404",
    })

    Reflect.set(fetcher, "requestTimeoutMs", 10)
    Reflect.set(fetcher, "retryDelays", [0, 0])

    await expect(fetcher.getPostCount()).resolves.toBe(12)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  }, 500)

  it("maps category and post list responses into public export models", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            result: {
              mylogCategoryList: [
                {
                  categoryName: "NestJS",
                  categoryNo: 10,
                  parentCategoryNo: null,
                  postCnt: 2,
                  divisionLine: false,
                  openYN: true,
                },
                {
                  categoryName: "Backend",
                  categoryNo: 11,
                  parentCategoryNo: 10,
                  postCnt: 1,
                  divisionLine: false,
                  openYN: true,
                },
              ],
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            result: {
              items: [
                {
                  logNo: 1,
                  titleWithInspectMessage: " 첫 글 ",
                  addDate: Date.parse("2024-03-01T12:00:00+09:00"),
                  categoryNo: 11,
                  categoryName: "Backend",
                  smartEditorVersion: 4,
                  thumbnailUrl: "https://mblogthumb-phinf.pstatic.net/thumb.png",
                  notOpen: false,
                  postBlocked: false,
                  buddyOpen: false,
                  bothBuddyOpen: false,
                },
              ],
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      )

    vi.stubGlobal("fetch", fetchMock)

    const fetcher = new NaverBlogFetcher({
      blogId: "mym0404",
    })

    await expect(fetcher.getCategories()).resolves.toEqual([
      {
        id: 10,
        name: "NestJS",
        parentId: null,
        postCount: 2,
        isDivider: false,
        isOpen: true,
        path: ["NestJS"],
        depth: 0,
      },
      {
        id: 11,
        name: "Backend",
        parentId: 10,
        postCount: 1,
        isDivider: false,
        isOpen: true,
        path: ["NestJS", "Backend"],
        depth: 1,
      },
    ])

    await expect(fetcher.getAllPosts({ expectedTotal: 1 })).resolves.toEqual([
      expect.objectContaining({
        sourceId: "mym0404",
        postId: "1",
        title: "첫 글",
        categoryId: 11,
        categoryName: "Backend",
        thumbnailUrl: "https://mblogthumb-phinf.pstatic.net/thumb.png?type=w800",
      }),
    ])
  })

  it("returns binary payload metadata for asset downloads", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(Buffer.from("image-binary"), {
        status: 200,
        headers: {
          "content-type": "image/gif",
        },
      }),
    )

    vi.stubGlobal("fetch", fetchMock)

    const fetcher = new NaverBlogFetcher({
      blogId: "mym0404",
    })

    const binary = await fetcher.fetchBinary({
      sourceUrl: "https://example.com/sticker.gif",
    })

    expect(binary.contentType).toBe("image/gif")
    expect(binary.bytes.toString()).toBe("image-binary")
  })

  it("retries html fetches after a transient server error", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("temporary", { status: 503, statusText: "Unavailable" }))
      .mockResolvedValueOnce(new Response("<div>ok</div>", { status: 200 }))

    vi.stubGlobal("fetch", fetchMock)

    const fetcher = new NaverBlogFetcher({
      blogId: "mym0404",
      retryDelays: [0, 0],
    })

    await expect(fetcher.fetchPostHtml("223034929697")).resolves.toBe("<div>ok</div>")
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("uses injected post html cache before fetching", async () => {
    const fetchMock = vi.fn<typeof fetch>()

    vi.stubGlobal("fetch", fetchMock)

    const fetcher = new NaverBlogFetcher({
      blogId: "mym0404",
      cache: {
        getPostHtml: async ({ sourceId, postId }) =>
          sourceId === "mym0404" && postId === "223034929697" ? "<div>cached</div>" : null,
      },
    })

    await expect(fetcher.fetchPostHtml("223034929697")).resolves.toBe("<div>cached</div>")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("stores fetched post html in the injected cache", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("<div>fresh</div>", { status: 200 }))
    const setPostHtml = vi.fn()

    vi.stubGlobal("fetch", fetchMock)

    const fetcher = new NaverBlogFetcher({
      blogId: "mym0404",
      cache: {
        getPostHtml: async () => null,
        setPostHtml,
      },
    })

    await expect(fetcher.fetchPostHtml("223034929697")).resolves.toBe("<div>fresh</div>")
    expect(setPostHtml).toHaveBeenCalledWith({
      sourceId: "mym0404",
      postId: "223034929697",
      html: "<div>fresh</div>",
    })
  })

  it("retries binary fetches after a transient server error", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("temporary", { status: 503, statusText: "Unavailable" }))
      .mockResolvedValueOnce(
        new Response(Buffer.from("recovered-image"), {
          status: 200,
          headers: {
            "content-type": "image/png",
          },
        }),
      )

    vi.stubGlobal("fetch", fetchMock)

    const fetcher = new NaverBlogFetcher({
      blogId: "mym0404",
      retryDelays: [0, 0],
    })

    const binary = await fetcher.fetchBinary({
      sourceUrl: "https://example.com/image.png",
    })

    expect(binary.contentType).toBe("image/png")
    expect(binary.bytes.toString()).toBe("recovered-image")
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
