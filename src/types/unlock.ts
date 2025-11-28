export interface OreUnlockPayload {
  v: 'u0'
  c: string
  m: string
  iv: string
  e: {
    epk: JsonWebKey
    iv: string
    sk: string
  }
}
