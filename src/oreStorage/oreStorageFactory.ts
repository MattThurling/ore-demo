import IpfsOreStorage from './ipfsOreStorage'

type StorageType = 'local' | 'cloud' | 'ipfs'

export function createStorage(storageType: StorageType) {
  switch (storageType) {
    case 'ipfs':
      return new IpfsOreStorage()
  }
}