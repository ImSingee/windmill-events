import * as wmill from "npm:windmill-client@1"
import { Message } from "./types.ts";

export async function enqueue(queuePath: string, messages: Message[]) {
  return await wmill.JobService.runScriptByPath({
    workspace: Deno.env.get('WM_WORKSPACE')!,
    path: queuePath,
    requestBody: {
      messages,
    },
    parentJob: Deno.env.get('WM_JOB_ID')
  })
}
