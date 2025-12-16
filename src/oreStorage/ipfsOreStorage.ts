import type oreStorage from './oreStorageInterface'

type ReadResult<TJson> =
| { kind: "json"; value: TJson }
| { kind: "bytes"; value: ArrayBuffer; contentType: string | null }

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

  async read<TJson = unknown>(key: string): Promise<ReadResult<TJson> | null> {
    try {
      const response = await fetch(`https://ipfs.io/ipfs/${key}`, { method: "GET" });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Reading failed: ${response.status} - ${errorText}`);
      }

      const contentType = response.headers.get("content-type");

      // If server tells you it's JSON, parse JSON
      if (contentType?.includes("application/json")) {
        return { kind: "json", value: await response.json() };
      }

      // Otherwise treat as bytes (audio/encrypted/etc.)
      return {
        kind: "bytes",
        value: await response.arrayBuffer(),
        contentType,
      };
    } catch (error) {
      console.log("❌ Error during read:", error);
      return null;
    }
  }


  async delete(key: string): Promise<void> {
    console.log('Deleting file' + key)
  }

}