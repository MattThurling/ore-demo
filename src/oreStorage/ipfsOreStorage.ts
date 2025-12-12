import type oreStorage from './oreStorageInterface'

export default class IpfsOreStorage implements oreStorage {
  async write(formData: FormData): Promise<string | void> {
    try {
      const response = await fetch(`${import.meta.env.VITE_STORAGE_URL}/pin` , {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        // Handle HTTP errors (4xx or 5xx)
        const errorText = await response.text()
        throw new Error(`Pinning failed: ${response.status} - ${errorText}`)
      }

      const json = await response.json()
      return json.cid
    } catch (error) {
      console.log('❌ Error during API call:', error)
    }
  }


  async read(key: string): Promise<string | null> {
    return('Writing file' + key)
  }

  async delete(key: string): Promise<void> {
    console.log('Deleting file' + key)
  }
}