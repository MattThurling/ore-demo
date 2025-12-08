import { type OreEnvelope } from "@mattthurling/ore"

export interface OreUnlockPayload {
  v: 'u0'
  c: string
  m: string
  iv: string
  e: OreEnvelope
}
