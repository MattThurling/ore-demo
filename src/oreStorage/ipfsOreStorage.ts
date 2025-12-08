import type oreStorage from './oreStorageInterface'

export default class IpfsOreStorage implements oreStorage {
  async write(key: string, data:string): Promise<void> {
    
  }

  async read(key: string): Promise<string | null> {
    return('Writing file' + key)
  }

  async delete(key: string): Promise<void> {
    console.log('Deleting file' + key)
  }
}