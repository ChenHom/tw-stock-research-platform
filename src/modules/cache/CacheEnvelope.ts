export interface CacheEnvelope<T> {
  data: T;
  expiresAt: number;
  staleUntil: number;
}

export function isFresh(envelope: CacheEnvelope<unknown>, now = Date.now()): boolean {
  return now <= envelope.expiresAt;
}

export function isStaleButUsable(envelope: CacheEnvelope<unknown>, now = Date.now()): boolean {
  return now > envelope.expiresAt && now <= envelope.staleUntil;
}
