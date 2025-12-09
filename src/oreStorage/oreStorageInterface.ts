export default interface OreStorage {
  write(key: string, data: Uint8Array): Promise<void>
  read(key: string): Promise<string | null>
  delete(key: string): Promise<void>
}