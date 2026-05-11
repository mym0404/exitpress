import { spawn } from "node:child_process"

const extraArgs = process.argv.slice(2)
const harnesses = [
  {
    label: "run-ui-smoke",
    scriptPath: "tests/e2e/run-ui-smoke.ts",
  },
  {
    label: "run-ui-resume-smoke",
    scriptPath: "tests/e2e/run-ui-resume-smoke.ts",
  },
] as const

const run = async () => {
  await Promise.all(
    harnesses.map(
      ({ label, scriptPath }) =>
        new Promise<void>((resolve, reject) => {
          const child = spawn("bun", [scriptPath, ...extraArgs], {
            cwd: process.cwd(),
            env: {
              ...process.env,
              GOODBYE_SMOKE_FAST: process.env.GOODBYE_SMOKE_FAST ?? "1",
            },
            stdio: "pipe",
          })

          child.stdout.on("data", (chunk) => {
            process.stdout.write(`[${label}] ${String(chunk)}`)
          })
          child.stderr.on("data", (chunk) => {
            process.stderr.write(`[${label}] ${String(chunk)}`)
          })
          child.on("error", reject)
          child.on("exit", (code, signal) => {
            if (code === 0) {
              resolve()
              return
            }

            reject(
              new Error(
                `${label} exited with code ${code ?? "null"}${signal ? ` (signal: ${signal})` : ""}`,
              ),
            )
          })
        }),
    ),
  )
}

void run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
