/**
 * IPFS gateways in order of preference. ipfs.io and dweb.link rate-limit
 * (429) and are being sunset, so the Pinata public gateway, where the pinner
 * pins, goes first. The others are fallbacks.
 */
export const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/'
export const IPFS_GATEWAYS = [IPFS_GATEWAY, 'https://dweb.link/ipfs/', 'https://ipfs.io/ipfs/']

export const gatewayUrl = (cid: string) => `${IPFS_GATEWAY}${cid}`
