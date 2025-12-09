export default interface OreStorage {
  write(manifest: unknown, data: Uint8Array): Promise<string | void>
  read(key: string): Promise<string | null>
  delete(key: string): Promise<void>
}