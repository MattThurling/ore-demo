import pako from 'pako'
import bs58 from 'bs58'

export function encode(oreId: unknown) {
  const json = JSON.stringify(oreId)
  const bytes = new TextEncoder().encode(json)
  const compressed = pako.gzip(bytes)
  return bs58.encode(compressed)
}

export function decode(encoded: string) {
  const compressed = bs58.decode(encoded)
  const bytes = pako.ungzip(compressed)
  const json = new TextDecoder().decode(bytes)
  return JSON.parse(json)
}
