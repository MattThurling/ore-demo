import type { Contributor, SplitParams } from '../types/ore'

/** Defaults for the split rule. Same numbers as the Versions dashboard's DEFAULT_PARAMS. */
export const DEFAULT_SPLIT: SplitParams = {
  usageWeight: 0.7,
  lineageCredit: 0.3,
  originatorShare: 0.1,
  categoryWeights: {
    vocals: 1.3,
    drums: 1.0,
    bass: 1.0,
    keys: 0.9,
    guitar: 1.0,
    piano: 1.0,
    synthesizer: 0.9,
    pad: 0.7,
    arpeggio: 0.8,
    strings: 0.8,
    horns: 0.9,
  },
}

export const EXAMPLE_TITLE = 'Drift (Collab Mix)'
export const EXAMPLE_REGISTRANT = 'marlo'

/** A five-stem collaborative mix. Ines's keys were built on Nyx's pad stem (lineage). */
export const EXAMPLE_CONTRIBUTORS: Contributor[] = [
  { name: 'Marlo', handle: 'marlo', wallet: '0x43A0e3D7bF73911a3FcCB92362B649De90750dF4', slot: 'A', category: 'vocals', role: 'composer', audibleSec: 150 },
  { name: 'Nyx', handle: 'nyx', wallet: '0xAE8b7ab5dad5FdA5E765E545506aA9B8889B7CBA', slot: 'B', category: 'drums', role: 'producer', audibleSec: 190 },
  { name: 'Kai', handle: 'kai', wallet: '0x7c1B3fA2E9d0c4F5a6B7C8d9E0F1a2B3c4D5e6F7', slot: 'C', category: 'bass', role: 'performer', audibleSec: 170 },
  { name: 'Ines', handle: 'ines', wallet: '0x19dE5b2c8A3f4E6d7C8b9A0f1E2d3C4b5A6f7E8d', slot: 'D', category: 'keys', role: 'performer', audibleSec: 120, derivedFrom: 'nyx' },
  { name: 'Nyx', handle: 'nyx', wallet: '0xAE8b7ab5dad5FdA5E765E545506aA9B8889B7CBA', slot: 'E', category: 'pad', role: 'producer', audibleSec: 90 },
]
