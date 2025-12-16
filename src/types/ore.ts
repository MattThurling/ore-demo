import { type OreEnvelope } from "@mattthurling/ore"

export interface OreId {
  version: '0.0.1'
  idName: string
  publicEncryptionKey: JsonWebKey
}

export interface OreUnlockPayload {
  v: '0.0.1'
  c: string
  m: string
  iv: string
  e: OreEnvelope
}
