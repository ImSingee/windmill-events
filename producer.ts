import { wmill } from "./deps.ts";

export type Meta = {
  id?: string,
  idKey?: string,
  ts?: number,
}

export type Message = Record<string, unknown>

export type MessageWithMeta = {
  message: Record<string, unknown> // real input message
  meta?: Meta,
}

export async function enqueue(queuePath: string, messages: MessageWithMeta[]) {
  return await wmill.JobService.runScriptByPath({
    workspace: Deno.env.get('WM_WORKSPACE')!,
    path: queuePath,
    requestBody: {
      messages,
      parentJob: Deno.env.get('WM_JOB_ID'),
    },
  })
}
