import { createHttpServer } from "./http/HttpServer.js"

const port = Number(process.env.PORT ?? "4173")
const server = createHttpServer()

server.listen(port, () => {
  console.log(`Exitpress running at http://localhost:${port}`)
})
