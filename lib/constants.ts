// ============================================================
// NMDb — Single Source of Truth for all dropdown/list values
// Edit here and every page that imports these updates instantly
// ============================================================

export const GENRES = [
  'Action', 'Comedy', 'Drama', 'Thriller', 'Romance',
  'Horror', 'Documentary', 'Animation', 'Crime', 'Family',
  'Mystery', 'Biography', 'Musical', 'Sci-Fi',
]

export const LANGUAGES = [
  'English', 'Yoruba', 'Igbo', 'Hausa', 'Nigerian Pidgin', 'Mixed',
]

export const STREAMING_PLATFORMS = [
  // Global
  'Netflix',
  'Prime Video',
  'Apple TV+',
  'Disney+',
  'HBO Max',
  'Hulu',
  'Tubi',
  'Peacock',
  'Paramount+',
  'Mubi',
  // Africa-focused
  'ShowMax',
  'Canal+',
  'ROK',
  'IrokoTV',
  'Africa Magic',
  'Startimes',
  'Buni TV',
  'NdaniTV',
  // YouTube & Free
  'YouTube',
  'YouTube Premium',
  // Other
  'Google Play',
  'Microsoft Store',
  'Vimeo',
]

// NFVCB classification ratings — Nigeria's official film rating body
export const CLASSIFICATIONS = [
  { value: 'G',   label: 'G — General Exhibition' },
  { value: 'PG',  label: 'PG — Parental Guidance' },
  { value: '12',  label: '12 — Suitable for 12 and over' },
  { value: '12A', label: '12A — Accompanied under 12' },
  { value: '15',  label: '15 — Suitable for 15 and over' },
  { value: '18',  label: '18 — Adults Only' },
  { value: 'RE',  label: 'RE — Restricted Exhibition' },
]

// Content type
export const CONTENT_TYPES = ['Movie', 'Series']

// Release type
export const RELEASE_TYPES = [
  'Cinema',
  'Straight-to-Streaming',
  'YouTube',
  'Direct-to-Video',
  'Festival',
]

// Status options
export const STATUS_OPTIONS = [
  'Released',
  'In Cinemas',
  'In Production',
  'Announced',
]

// All roles a person can hold in a Nollywood production
export const ALL_ROLES = [
  // On Screen
  'Actor', 'Voice Actor',
  // Direction & Production
  'Director', 'Co-Director', 'Producer', 'Executive Producer',
  'Line Producer', 'Associate Producer',
  // Writing
  'Writer', 'Screenplay Writer', 'Story Developer',
  // Camera & Visuals
  'Cinematographer', 'Director of Photography', 'Camera Operator',
  // Post Production
  'Editor', 'Colorist', 'VFX Artist',
  // Sound
  'Sound Designer', 'Composer', 'Music Supervisor',
  // Other Key Crew
  'Costume Designer', 'Production Designer', 'Art Director',
  'Makeup Artist', 'Stunt Coordinator', 'Casting Director',
]

export const GENDERS = [
  'Male', 'Female', 'Non-binary', 'Prefer not to say',
]
