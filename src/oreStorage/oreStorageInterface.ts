export default interface OreStorage {
  /** Human-readable reason the last write or read failed, for the UI to show. */
  lastError?: string
  write(manifest: unknown, data: Uint8Array): Promise<string | void>
  read(key: string): Promise<any | null>
  delete(key: string): Promise<void>
}