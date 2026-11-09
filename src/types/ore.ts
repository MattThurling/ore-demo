import { type OreEnvelope, type OreTrackManifest } from '@mattthurling/ore'

/** A listener's or platform's published identity: a name and a public encryption key. */
export interface OreId {
  version: '0.0.1'
  idName: string
  publicEncryptionKey: JsonWebKey
}

// ---------------------------------------------------------------------------
// Open Rights Protocol objects. These shapes are shared with the Versions
// dashboard (src/orp/types.ts there) so the two apps interoperate over IPFS.
// ---------------------------------------------------------------------------

export type Role = 'composer' | 'producer' | 'performer' | 'remixer' | 'sampled'
export const ROLES: Role[] = ['composer', 'producer', 'performer', 'remixer', 'sampled']

/** Stem categories as used by the Versions API. */
export const STEM_CATEGORIES = [
  'vocals', 'drums', 'bass', 'keys', 'guitar', 'piano',
  'synthesizer', 'pad', 'arpeggio', 'strings', 'horns',
] as const

/** Versions mixer slots. */
export const SLOTS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const

/** One contributor's stem in a collaborative work. */
export interface Contributor {
  name: string
  handle: string
  wallet: string
  /** Versions mixer slot the stem occupies. */
  slot: string
  category: string
  role: Role
  /** Seconds the stem is audible within the track. */
  audibleSec: number
  /** Lineage: handle of the contributor whose stem this one was built on. */
  derivedFrom?: string
}

/** Parameters of the split rule, declared by the rights holders at publish time. */
export interface SplitParams {
  /** 0 = split on audible duration only, 1 = split on what listeners actually heard. */
  usageWeight: number
  /** Fraction of a derived stem's share that flows back to the stem it was built on. */
  lineageCredit: number
  /** Share taken off the top for the registrant. */
  originatorShare: number
  /** Per-category multiplier: how much a kind of stem is valued. */
  categoryWeights: Record<string, number>
}

/** Who holds rights in the work and how revenue is to be split. Published with the track. */
export interface RightsRecord {
  version: '0.0.1'
  title: string
  /** Handle of the registering contributor. */
  registrant: string
  contributors: Contributor[]
  split: SplitParams
}

/** What a platform pays under its licence. Travels in the platform's envelope payload. */
export interface LicenceTerms {
  model: 'per-listened-second'
  ratePerSecond: number
  currency: 'EUR'
  settlement: 'batch'
}

/** The JSON published for a track: where the ciphertext is, how to decrypt it, who holds rights. */
export interface PublishedTrack {
  cid: string
  manifest: OreTrackManifest
  rights?: RightsRecord
}

/** The JSON a recipient reads to unlock a track. */
export interface OreUnlockPayload {
  v: '0.0.1'
  /** CID of the PublishedTrack JSON. */
  c: string
  m: string
  iv: string
  e: OreEnvelope
  /** Present when the recipient is a platform. */
  licence?: LicenceTerms
}
