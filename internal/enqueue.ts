import { wmill } from "../deps.ts"
import { MessageWithMeta } from "../producer.ts";

export let enqueueService = 'f/_queue/enqueue'

export async function enqueueMessages(queue: string, messages: MessageWithMeta[]) {
  return await wmill.JobService.runWaitResultScriptByPath({
    workspace: Deno.env.get('WM_WORKSPACE')!,
    path: enqueueService,
    requestBody: {
      queue, messages,
    },
    parentJob: Deno.env.get('WM_JOB_ID')
  })
}
