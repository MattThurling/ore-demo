import { createHelia, type Helia } from 'helia'
import { unixfs, type UnixFS } from '@helia/unixfs'
import { CID } from 'multiformats/cid'

export interface HeliaContext {
  helia: Helia
  fs: UnixFS
}

/**
 * Create a Helia node + UnixFS helper.
 * Call this once and reuse.
 */
export async function createHeliaContext(): Promise<HeliaContext> {
  const helia = await createHelia()
  const fs = unixfs(helia)
  return { helia, fs }
}


/**
 * Add encrypted bytes to IPFS, return CID string.
 */
export async function addEncryptedBytes(
  fs: UnixFS,
  data: Uint8Array
): Promise<string> {
  const cid = await fs.addBytes(data)
  return cid.toString()
}

/**
 * Fetch encrypted bytes from IPFS given a CID string.
 */
export async function getEncryptedBytes(
  fs: UnixFS,
  cidString: string
): Promise<Uint8Array> {
  const cid = CID.parse(cidString)
  const chunks: Uint8Array[] = []

  for await (const chunk of fs.cat(cid)) {
    chunks.push(chunk)
  }

  const totalLength = chunks.reduce((sum, c) => sum + c.byteLength, 0)
  const out = new Uint8Array(totalLength)
  let offset = 0
  for (const c of chunks) {
    out.set(c, offset)
    offset += c.byteLength
  }

  return out
}
