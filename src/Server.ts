import { createHttpServer } from "./server/http/HttpServer.js"

const port = Number(process.env.PORT ?? "4173")
const server = createHttpServer()

server.listen(port, () => {
  console.log(`Goodbye Naver Blog running at http://localhost:${port}`)
})
