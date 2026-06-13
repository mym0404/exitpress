import type { Blog } from "./Blog.js"

export type BlogRegistry = {
  list: () => Blog[]
  get: (key: string) => Blog | undefined
  require: (key: string) => Blog
}

export const createBlogRegistry = (blogs: Blog[]): BlogRegistry => {
  const blogByKey = new Map<string, Blog>()

  blogs.forEach((blog) => {
    if (blogByKey.has(blog.key)) {
      throw new Error(`Duplicate blog key: ${blog.key}`)
    }

    blogByKey.set(blog.key, blog)
  })

  return {
    list: () => [...blogByKey.values()],
    get: (key) => blogByKey.get(key),
    require: (key) => {
      const blog = blogByKey.get(key)

      if (!blog) {
        throw new Error(`Unknown blog key: ${key}`)
      }

      return blog
    },
  }
}
