// Data-owned avatar registry.
//
// AvatarSVG (components/Illustrations.tsx) renders from this registry, so
// adding or tweaking avatars is a data change. Flat style consistent with the
// rest of the illustration system: palette background ring, simple face,
// hairstyle/accessory, shoulders.

interface AvatarArtProps {
  size: number;
  className?: string;
}

interface AvatarDef {
  id: string;
  label: string;
  art: (props: AvatarArtProps) => JSX.Element;
}

const EYES_DARK = '#3D2817';

// Shared building blocks ------------------------------------------------------

function Face({ skin, eyes = '#FFFFFF' }: { skin: string; eyes?: string }) {
  return (
    <>
      <circle cx="40" cy="32" r="16" fill={skin} />
      <circle cx="34" cy="32" r="2.5" fill={eyes} />
      <circle cx="46" cy="32" r="2.5" fill={eyes} />
    </>
  );
}

function Smile({ y = 40 }: { y?: number }) {
  return (
    <path
      d={`M34 ${y} Q40 ${y + 4} 46 ${y}`}
      stroke={EYES_DARK}
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
  );
}

function Shoulders({ shirt }: { shirt: string }) {
  return <path d="M20 70 Q20 52 40 52 Q60 52 60 70 Z" fill={shirt} />;
}

function Glasses() {
  return (
    <g fill="none" stroke="#172033" strokeWidth="1.8">
      <circle cx="34" cy="32" r="5.2" />
      <circle cx="46" cy="32" r="5.2" />
      <line x1="39.2" y1="32" x2="40.8" y2="32" />
    </g>
  );
}

function wrap(bg: string, label: string, size: number, className: string | undefined, inner: JSX.Element) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label={label}>
      <circle cx="40" cy="40" r="36" fill={bg} opacity="0.2" />
      {inner}
    </svg>
  );
}

// Avatars ---------------------------------------------------------------------

const AVATARS: AvatarDef[] = [
  {
    id: 'av1',
    label: 'Avatar 1',
    art: ({ size, className }) => wrap('#D89B24', 'Avatar 1', size, className, (
      <>
        <Face skin="#F05A47" />
        <path d="M24 28 Q24 20 40 18 Q56 20 56 28" fill="#3D2817" />
        <Smile />
        <Shoulders shirt="#0F766E" />
      </>
    )),
  },
  {
    id: 'av2',
    label: 'Avatar 2',
    art: ({ size, className }) => wrap('#168A72', 'Avatar 2', size, className, (
      <>
        {/* long hair behind the face */}
        <path d="M23 22 Q28 12 40 12 Q52 12 57 22 L57 50 Q53 55 49 52 L49 32 L31 32 L31 52 Q27 55 23 50 Z" fill="#5D3A1A" />
        <Face skin="#FFD93D" eyes={EYES_DARK} />
        <path d="M26 24 Q28 16 40 15 Q52 16 54 24 L52 26 Q46 21 40 21 Q34 21 28 26 Z" fill="#5D3A1A" />
        <Smile />
        <Shoulders shirt="#168A72" />
      </>
    )),
  },
  {
    id: 'av3',
    label: 'Avatar 3',
    art: ({ size, className }) => wrap('#6657C8', 'Avatar 3', size, className, (
      <>
        <circle cx="40" cy="19" r="13" fill="#3D2817" />
        <circle cx="28" cy="25" r="6" fill="#3D2817" />
        <circle cx="52" cy="25" r="6" fill="#3D2817" />
        <Face skin="#FF8B6A" eyes={EYES_DARK} />
        <Smile y={41} />
        <Shoulders shirt="#6657C8" />
      </>
    )),
  },
  {
    id: 'av4',
    label: 'Avatar 4',
    art: ({ size, className }) => wrap('#9B5CC4', 'Avatar 4', size, className, (
      <>
        <Face skin="#F4C2A1" eyes={EYES_DARK} />
        <path d="M26 26 Q26 16 40 14 Q54 16 54 26 L52 22 Q46 18 40 18 Q34 18 28 22 Z" fill="#F05A47" />
        <Smile />
        <Shoulders shirt="#9B5CC4" />
      </>
    )),
  },
  {
    id: 'av5',
    label: 'Avatar 5',
    art: ({ size, className }) => wrap('#F05A47', 'Avatar 5', size, className, (
      <>
        <Face skin="#C4A86F" />
        <path d="M28 22 Q28 14 40 14 Q52 14 52 22 L50 28 Q46 24 40 24 Q34 24 30 28 Z" fill="#3D2817" />
        <Smile />
        <Shoulders shirt="#53708A" />
      </>
    )),
  },
  {
    id: 'av6',
    label: 'Avatar 6',
    art: ({ size, className }) => wrap('#0F766E', 'Avatar 6', size, className, (
      <>
        <Face skin="#FFD93D" eyes={EYES_DARK} />
        <path d="M26 30 Q26 18 40 16 Q54 18 54 30 L52 24 Q46 20 40 20 Q34 20 28 24 Z" fill="#0F766E" />
        <Smile />
        <Shoulders shirt="#F05A47" />
      </>
    )),
  },
  {
    id: 'av7',
    label: 'Avatar 7 with glasses',
    art: ({ size, className }) => wrap('#168A72', 'Avatar 7 with glasses', size, className, (
      <>
        <Face skin="#F4C2A1" eyes={EYES_DARK} />
        <path d="M25 28 Q25 19 40 17 Q55 19 55 28 L54 24 Q48 21 40 21 Q32 21 26 24 Z" fill="#5D3A1A" />
        <Glasses />
        <Smile />
        <Shoulders shirt="#168A72" />
      </>
    )),
  },
  {
    id: 'av8',
    label: 'Avatar 8 with glasses',
    art: ({ size, className }) => wrap('#9B5CC4', 'Avatar 8 with glasses', size, className, (
      <>
        <path d="M23 22 Q28 12 40 12 Q52 12 57 22 L57 50 Q53 55 49 52 L49 32 L31 32 L31 52 Q27 55 23 50 Z" fill="#172033" />
        <Face skin="#C4A86F" eyes={EYES_DARK} />
        <path d="M26 24 Q28 16 40 15 Q52 16 54 24 L52 26 Q46 21 40 21 Q34 21 28 26 Z" fill="#172033" />
        <Glasses />
        <Smile />
        <Shoulders shirt="#F05A47" />
      </>
    )),
  },
  {
    id: 'av9',
    label: 'Avatar 9 with hijab',
    art: ({ size, className }) => wrap('#168A72', 'Avatar 9 with hijab', size, className, (
      <>
        <circle cx="40" cy="30" r="17" fill="#1D8A73" />
        <ellipse cx="40" cy="34" rx="12.5" ry="13" fill="#C4A86F" />
        <path d="M21 70 Q21 53 40 53 Q59 53 59 70 Z" fill="#1D8A73" />
        <circle cx="34.5" cy="34" r="2.4" fill={EYES_DARK} />
        <circle cx="45.5" cy="34" r="2.4" fill={EYES_DARK} />
        <Smile y={41} />
      </>
    )),
  },
  {
    id: 'av10',
    label: 'Avatar 10 with hijab',
    art: ({ size, className }) => wrap('#F05A47', 'Avatar 10 with hijab', size, className, (
      <>
        <circle cx="40" cy="30" r="17" fill="#D9502F" />
        <ellipse cx="40" cy="34" rx="12.5" ry="13" fill="#F4C2A1" />
        <path d="M21 70 Q21 53 40 53 Q59 53 59 70 Z" fill="#D9502F" />
        <circle cx="34.5" cy="34" r="2.4" fill={EYES_DARK} />
        <circle cx="45.5" cy="34" r="2.4" fill={EYES_DARK} />
        <Smile y={41} />
      </>
    )),
  },
  {
    id: 'av11',
    label: 'Avatar 11',
    art: ({ size, className }) => wrap('#D89B24', 'Avatar 11', size, className, (
      <>
        <circle cx="40" cy="13" r="7" fill="#3D2817" />
        <Face skin="#FF8B6A" eyes={EYES_DARK} />
        <path d="M25 29 Q26 19 40 18 Q54 19 55 29 L53 25 Q47 22 40 22 Q33 22 27 25 Z" fill="#3D2817" />
        <Smile />
        <Shoulders shirt="#6657C8" />
      </>
    )),
  },
  {
    id: 'av12',
    label: 'Avatar 12',
    art: ({ size, className }) => wrap('#6657C8', 'Avatar 12', size, className, (
      <>
        <Face skin="#FFD93D" eyes={EYES_DARK} />
        <path d="M24 32 Q22 18 40 15 Q58 18 56 32 L54 26 Q48 21 40 21 Q32 21 26 26 Z" fill="#8A5A2E" />
        <Smile />
        <Shoulders shirt="#0F766E" />
      </>
    )),
  },
];

export const AVATAR_IDS: string[] = AVATARS.map(a => a.id);

export function renderAvatar(avatarId: string, size: number, className?: string): JSX.Element | null {
  const found = AVATARS.find(a => a.id === avatarId) || AVATARS[0];
  return found.art({ size, className });
}

export type { AvatarDef };
