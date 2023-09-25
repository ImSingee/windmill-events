export type AnyMessage = Record<string, unknown>

export type Meta = {
  id: string,
  ts: number,
}

export type Event = {
  queue: string,
  message: AnyMessage,
  meta: Meta
}
