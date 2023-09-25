export type Meta = {
  id?: string,
  idKey?: string,
  ts?: number,
}

export type Message = {
  message: Record<string, unknown>
  meta?: Meta,
}
