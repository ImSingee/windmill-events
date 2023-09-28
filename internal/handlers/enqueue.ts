import { wmill } from '../../deps.ts'
import { MessageWithMeta, Meta } from "../../producer.ts";
import { dispatcherService, dispatcherWorkspace } from "../services.ts";

type Result = {
  id?: string,
  success: boolean,
  inserted: boolean,
  error?: string
}

// f/_queue/enqueue
export default async function main(
  queue: string, // name of the queue
  messages: MessageWithMeta[],
) {
  const cache = new Cache(queue)
  await cache.load();

  const results: Result[] = []

  for (const message of messages) {
    try {
      results.push(await process(queue, message.message, message.meta, cache))
    } catch (err) {
      results.push({success: false, inserted: false, error: `${err}`})
    }
  }

  await cache.save();

  return {results}
}

function process(queue: string, message: Record<string, unknown>, meta: Meta | undefined, cache: Cache): Promise<Result> {
  if (typeof message !== 'object') {
    throw new Error(`invalid message (not an object, is ${typeof message})`)
  }

  let id: string;
  if (meta && meta.id) {
    id = meta.id
  } else if (meta && meta.idKey) {
    if (!(meta.idKey in message)) {
      throw new Error(`idKey ${meta.idKey} does not exist in message (available keys: ${Object.keys(message)})`)
    }

    let maybeId = message[meta.idKey]
    if (!maybeId) {
      throw new Error(`idKey ${meta.idKey} of message is zero value`)
    }
    if (typeof maybeId !== 'string') {
      throw new Error(`idKey ${meta.idKey} of message isnot string`)
    }

    id = maybeId
  } else {
    id = crypto.randomUUID()
  }

  let ts: number;
  if (meta && meta.ts) {
    ts = meta.ts
  } else {
    ts = +new Date()
  }

  return enqueue(queue, message, {id, ts}, cache)
}

async function enqueue(queue: string, message: Record<string, unknown>, meta: {
  id: string,
  ts: number
}, cache: Cache): Promise<Result> {
  const {id, ts} = meta;

  if (cache.isExist(id)) {
    console.log(`Ignore ${queue} message ${id} (duplicate) at ${localTimeString(ts)}: ${messageToString(message)}`)
    return {id, success: true, inserted: false}
  }
  cache.insert(id);

  console.log(`Enqueue ${queue} message ${id} at ${localTimeString(ts)}: ${messageToString(message)}`)

  await wmill.JobService.runScriptByPath({
    workspace: dispatcherWorkspace,
    path: dispatcherService,
    requestBody: {
      queue, message, meta,
    },
  })

  return {id, success: true, inserted: true}
}

function messageToString(message: Record<string, unknown>): string {
  const toSerialize: Record<string, string> = {}
  for (const key in message) {
    let value = `${message[key]}`
    if (value.length > 20) {
      value = `${value.substring(0, 8)}...${value.substring(value.length - 8)}`
    }
    toSerialize[key] = value
  }

  return JSON.stringify(toSerialize)
}

function localTimeString(ts: number): string {
  return new Date(ts).toISOString()
}

class Cache {
  queue: string
  maxCachedKeysCount = 300
  #cachedKeys?: Set<string>
  #cachedKeysArray?: string[]

  constructor(queue: string) {
    this.queue = queue
  }


  getCacheStatePath(): string {
    return `${Deno.env.get('WM_PERMISSIONED_AS')}/_queue/${this.queue}`
  }

  async load() {
    let cachedKeys = await wmill.getResource(this.getCacheStatePath(), true)
    if (cachedKeys && Array.isArray(cachedKeys) && cachedKeys.length > 0) {
      this.#cachedKeysArray = cachedKeys
      this.#cachedKeys = new Set(cachedKeys)
    } else {
      this.#cachedKeysArray = []
      this.#cachedKeys = new Set()
    }
  }

  async save() {
    if (this.#cachedKeysArray!.length > this.maxCachedKeysCount) {
      this.#cachedKeysArray!.splice(0, this.#cachedKeysArray!.length - this.maxCachedKeysCount)
    }

    await wmill.setResource(this.#cachedKeysArray!, this.getCacheStatePath(), 'cache')
  }

  insert(key: string) {
    this.#cachedKeys!.add(key)
    this.#cachedKeysArray!.push(key)
  }

  isExist(key: string): boolean {
    return this.#cachedKeys!.has(key)
  }
}
