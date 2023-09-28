import { wmill } from "../deps.ts"
import { MessageWithMeta } from "../producer.ts";
import { enqueueService } from "./services.ts";


export function enqueueMessages(queue: string, messages: MessageWithMeta[]): Promise<unknown> {
  return wmill.JobService.runWaitResultScriptByPath({
    workspace: Deno.env.get('WM_WORKSPACE')!,
    path: enqueueService,
    requestBody: {
      queue, messages,
    },
  })
}
