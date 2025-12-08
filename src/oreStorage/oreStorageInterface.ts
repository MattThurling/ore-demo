export default interface OreStorage {
  write(key: string, data: string): Promise<void>
  read(key: string): Promise<string | null>
  delete(key: string): Promise<void>
}