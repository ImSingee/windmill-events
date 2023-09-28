import { wmill } from '../../deps.ts';
import { AnyMessage, Meta } from "../../consumer.ts";

export default async function main(
  queue: string,
  message: AnyMessage,
  meta: Meta
) {
  const {id} = meta

  console.log(`Dispatch for message [${queue}] ${id}`)

  // load dispatchers
  const dispatchers = await getDispatchers(queue);
  console.log(`Dispatchers: ${dispatchers}`)

  // run all
  const createdJobs: string[] = []
  const failedJobs = []
  for (const dispatcher of dispatchers) {
    console.log(`Dispatch to ${dispatcher}`)

    try {
      if (dispatcher.startsWith('script/')) {
        const path = dispatcher.substring('script/'.length);

        const createdJob = await wmill.JobService.runScriptByPath({
          workspace: Deno.env.get('WM_WORKSPACE')!,
          path,
          requestBody: {
            queue, message, meta,
            event: {queue, message, meta},
          },
        })
        createdJobs.push(createdJob)
      } else if (dispatcher.startsWith('flow/')) {
        const path = dispatcher.substring('flow/'.length);

        const createdJob = await wmill.JobService.runFlowByPath({
          workspace: Deno.env.get('WM_WORKSPACE')!,
          path,
          requestBody: {
            queue, message, meta,
            event: {queue, message, meta},
          },
        })
        createdJobs.push(createdJob)
      } else {
        throw new Error(`unknown dispatch type for ${dispatcher}`)
      }
    } catch (err) {
      console.error(`Failed to dispatch to ${dispatcher}: ${err}`)
      failedJobs.push({to: dispatcher, error: `${err}`})
    }
  }

  console.log(`createdJobs: ${JSON.stringify(createdJobs)}`)
  if (failedJobs.length != 0) {
    throw new Error(`failed to dispatch to: ${JSON.stringify(failedJobs)}`)
  }

  return {createdJobs}
}

type DispatcherDescription = {
  to: string[]
}

async function getDispatchers(queue: string): Promise<string[]> {
  const dispatchResource = `f/_queue/${queue}`

  const dispatchers: DispatcherDescription | undefined = await wmill.getResource(dispatchResource, false)
  if (!dispatchers || typeof dispatchers !== 'object' || !('to' in dispatchers)) {
    throw new Error(`missing or invalid dispatch resource ${dispatchResource}`)
  }

  return dispatchers.to
}
