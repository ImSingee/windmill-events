import { wmill } from "../deps.ts"
import { Message } from "../types.ts";

export let enqueueService = 'f/_queue/enqueue'

export async function enqueueMessages(queue: string, messages: Message[]) {
  return await wmill.JobService.runWaitResultScriptByPath({
    workspace: Deno.env.get('WM_WORKSPACE')!,
    path: enqueueService,
    requestBody: {
      queue, messages,
    },
    parentJob: Deno.env.get('WM_JOB_ID')
  })
}
