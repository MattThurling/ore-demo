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
  { name: 'Marlo', handle: 'marlo', slot: 'A', category: 'vocals', role: 'composer', audibleSec: 150 },
  { name: 'Nyx', handle: 'nyx', slot: 'B', category: 'drums', role: 'producer', audibleSec: 190 },
  { name: 'Kai', handle: 'kai', slot: 'C', category: 'bass', role: 'performer', audibleSec: 170 },
  { name: 'Ines', handle: 'ines', slot: 'D', category: 'keys', role: 'performer', audibleSec: 120, derivedFrom: 'nyx' },
  { name: 'Nyx', handle: 'nyx', slot: 'E', category: 'pad', role: 'producer', audibleSec: 90 },
]
