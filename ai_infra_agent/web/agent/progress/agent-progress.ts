export interface ProcessRequestParams {
  request: string
  dryRun: boolean
}

export const processRequest = async ({ request, dryRun }: ProcessRequestParams) => {
  const res = await fetch("http://localhost:8000/api/v1/agent/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      request,
      dry_run: dryRun,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `HTTP ${res.status}`)
  }

  return res.json()
}
