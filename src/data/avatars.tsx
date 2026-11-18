// Data-owned avatar registry — "friendly buddy" style.
//
// AvatarSVG (components/Illustrations.tsx) renders from this registry, so
// tweaking avatars is a data change. Buddy style: natural skin tones, brows,
// open smiles with eye highlights, rosy cheeks, voluminous hair (cap, curly,
// long, braids, bun, puffs, hijab), white uniform collars, soft shadows and a
// hairline outline for depth. ids av1-av12 keep their identities (glasses on
// 7/8, hijab on 9/10); av13-av16 add more variety.

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
const OUTLINE = 'rgba(23, 32, 51, 0.16)';
const BLUSH = '#FF8A7A';

// Shared building blocks ------------------------------------------------------

function Shadow() {
  return <ellipse cx="40" cy="64" rx="17" ry="4.5" fill="#172033" opacity="0.08" />;
}

function FaceBase({ skin }: { skin: string }) {
  return (
    <>
      <circle cx="23.8" cy="34" r="3.1" fill={skin} stroke={OUTLINE} strokeWidth="1.1" />
      <circle cx="56.2" cy="34" r="3.1" fill={skin} stroke={OUTLINE} strokeWidth="1.1" />
      <circle cx="40" cy="32" r="16.5" fill={skin} stroke={OUTLINE} strokeWidth="1.4" />
    </>
  );
}

function Eyes() {
  return (
    <>
      <circle cx="33.8" cy="33" r="3.1" fill={EYES_DARK} />
      <circle cx="32.8" cy="31.9" r="1.05" fill="#FFFFFF" />
      <circle cx="46.2" cy="33" r="3.1" fill={EYES_DARK} />
      <circle cx="45.2" cy="31.9" r="1.05" fill="#FFFFFF" />
    </>
  );
}

function Brows({ mood = 'up' }: { mood?: 'up' | 'calm' }) {
  const rise = mood === 'up' ? 2.4 : 1.2;
  return (
    <g stroke={EYES_DARK} strokeWidth="1.7" fill="none" strokeLinecap="round">
      <path d={`M29.6 ${29 - rise / 2} Q33.6 ${29 - rise} 37.6 ${29 - rise / 2}`} />
      <path d={`M42.4 ${29 - rise / 2} Q46.4 ${29 - rise} 50.4 ${29 - rise / 2}`} />
    </g>
  );
}

function Smile() {
  return <path d="M30.5 39.2 Q40 51.5 49.5 39.2 Q40 44.6 30.5 39.2 Z" fill={EYES_DARK} />;
}

function Cheeks() {
  return (
    <g fill={BLUSH} opacity="0.35">
      <circle cx="27" cy="38.4" r="2.7" />
      <circle cx="53" cy="38.4" r="2.7" />
    </g>
  );
}

function Shoulders({ shirt }: { shirt: string }) {
  return (
    <>
      <path d="M16.5 72 Q16.5 50.5 40 50.5 Q63.5 50.5 63.5 72 Z" fill={shirt} stroke={OUTLINE} strokeWidth="1.4" />
      <path d="M30 50.8 Q40 59.5 50 50.8 L50 56.5 Q40 64.5 30 56.5 Z" fill="#F8FAFC" opacity="0.95" />
    </>
  );
}

function PlainShoulders({ shirt }: { shirt: string }) {
  return (
    <path d="M16.5 72 Q16.5 50.5 40 50.5 Q63.5 50.5 63.5 72 Z" fill={shirt} stroke={OUTLINE} strokeWidth="1.4" />
  );
}

function Glasses() {
  return (
    <g fill="none" stroke="#172033" strokeWidth="1.8">
      <circle cx="33.8" cy="33" r="5.6" />
      <circle cx="46.2" cy="33" r="5.6" />
      <line x1="39.4" y1="32.4" x2="40.6" y2="32.4" />
      <line x1="28.2" y1="33" x2="23.8" y2="33" />
      <line x1="51.8" y1="33" x2="56.2" y2="33" />
    </g>
  );
}

// Hair pieces -----------------------------------------------------------------

function HairCap({ c }: { c: string }) {
  return (
    <path
      d="M22.6 31.5 Q23 13.5 40 13.5 Q57 13.5 57.4 31.5 Q56 24 49.5 21.5 Q44 19.6 40 19.6 Q36 19.6 30.5 21.5 Q24 24 22.6 31.5 Z"
      fill={c}
      stroke={OUTLINE}
      strokeWidth="1.2"
    />
  );
}

function HairFringe({ c }: { c: string }) {
  return (
    <path
      d="M22.6 31.5 Q23 13.5 40 13.5 Q57 13.5 57.4 31.5 Q54 23.5 40 23.5 Q26 23.5 22.6 31.5 Z"
      fill={c}
      stroke={OUTLINE}
      strokeWidth="1.2"
    />
  );
}

function HairCurly({ c }: { c: string }) {
  return (
    <g fill={c} stroke={OUTLINE} strokeWidth="1.1">
      <circle cx="25" cy="22" r="6.5" />
      <circle cx="31" cy="16.5" r="7" />
      <circle cx="40" cy="14.5" r="7.8" />
      <circle cx="49" cy="16.5" r="7" />
      <circle cx="55" cy="22" r="6.5" />
      <circle cx="57" cy="28.5" r="4.8" />
      <circle cx="23" cy="28.5" r="4.8" />
    </g>
  );
}

function HairLongBehind({ c }: { c: string }) {
  return (
    <path
      d="M20 30 Q20 11.5 40 11.5 Q60 11.5 60 30 L60 58 Q60 63 55.5 63 L49.5 63 L49.5 34 L30.5 34 L30.5 63 L24.5 63 Q20 63 20 58 Z"
      fill={c}
      stroke={OUTLINE}
      strokeWidth="1.3"
    />
  );
}

function Braids({ c }: { c: string }) {
  return (
    <g>
      <rect x="16.5" y="28" width="6.5" height="27" rx="3.2" fill={c} stroke={OUTLINE} strokeWidth="1.1" />
      <rect x="57" y="28" width="6.5" height="27" rx="3.2" fill={c} stroke={OUTLINE} strokeWidth="1.1" />
      <circle cx="19.75" cy="43" r="2" fill="#D89B24" />
      <circle cx="60.25" cy="43" r="2" fill="#D89B24" />
      <circle cx="19.75" cy="55" r="3.6" fill={c} stroke={OUTLINE} strokeWidth="1.1" />
      <circle cx="60.25" cy="55" r="3.6" fill={c} stroke={OUTLINE} strokeWidth="1.1" />
    </g>
  );
}

function Bun({ c }: { c: string }) {
  return (
    <g>
      <circle cx="40" cy="12.5" r="6.8" fill={c} stroke={OUTLINE} strokeWidth="1.2" />
      <rect x="34" y="17.5" width="12" height="3" rx="1.5" fill="#D89B24" />
    </g>
  );
}

function Puffs({ c }: { c: string }) {
  return (
    <g fill={c} stroke={OUTLINE} strokeWidth="1.2">
      <circle cx="26.5" cy="16" r="7.5" />
      <circle cx="53.5" cy="16" r="7.5" />
    </g>
  );
}

function HijabBack({ color, fold }: { color: string; fold: string }) {
  return (
    <g>
      <path
        d="M40 11 Q62 11 62 34 Q62 50 53 58 L53 63 L27 63 L27 58 Q18 50 18 34 Q18 11 40 11 Z"
        fill={color}
        stroke={OUTLINE}
        strokeWidth="1.4"
      />
      <path d="M25 25 Q30 16.5 40 15.8" stroke={fold} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
    </g>
  );
}

function HijabChin({ color }: { color: string }) {
  return <path d="M28.5 45.5 Q40 55.5 51.5 45.5 L51.5 53 Q40 62 28.5 53 Z" fill={color} stroke={OUTLINE} strokeWidth="1.2" />;
}

function Freckles() {
  return (
    <g fill="#C98A5E" opacity="0.75">
      <circle cx="29.5" cy="36.6" r="0.9" />
      <circle cx="33" cy="37.4" r="0.9" />
      <circle cx="26.6" cy="37.6" r="0.9" />
      <circle cx="50.5" cy="36.6" r="0.9" />
      <circle cx="53.5" cy="37.4" r="0.9" />
    </g>
  );
}

function wrap(bg: string, label: string, size: number, className: string | undefined, inner: JSX.Element) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label={label}>
      <circle cx="40" cy="40" r="36" fill={bg} opacity="0.22" />
      {inner}
    </svg>
  );
}

// Avatars ---------------------------------------------------------------------
// Paint order per avatar: shadow, shoulders, (hair behind), face base, eyes,
// brows, smile, cheeks, hair front, accessories. Skin tones span a natural
// range from light to deep brown.

const AVATARS: AvatarDef[] = [
  {
    id: 'av1',
    label: 'Avatar 1',
    art: ({ size, className }) => wrap('#D89B24', 'Avatar 1', size, className, (
      <>
        <Shadow />
        <Shoulders shirt="#0F766E" />
        <FaceBase skin="#E8A97C" />
        <Eyes />
        <Brows />
        <Smile />
        <Cheeks />
        <HairCap c="#2E2A28" />
      </>
    )),
  },
  {
    id: 'av2',
    label: 'Avatar 2 with long hair',
    art: ({ size, className }) => wrap('#168A72', 'Avatar 2 with long hair', size, className, (
      <>
        <Shadow />
        <Shoulders shirt="#F05A47" />
        <HairLongBehind c="#6B4A32" />
        <FaceBase skin="#FFD9B8" />
        <Eyes />
        <Brows mood="calm" />
        <Smile />
        <Cheeks />
        <HairFringe c="#6B4A32" />
      </>
    )),
  },
  {
    id: 'av3',
    label: 'Avatar 3 with a top bun',
    art: ({ size, className }) => wrap('#6657C8', 'Avatar 3 with a top bun', size, className, (
      <>
        <Shadow />
        <Shoulders shirt="#9B5CC4" />
        <FaceBase skin="#E8A97C" />
        <Eyes />
        <Brows mood="calm" />
        <Smile />
        <Cheeks />
        <Bun c="#3D2817" />
        <HairCap c="#3D2817" />
      </>
    )),
  },
  {
    id: 'av4',
    label: 'Avatar 4 with curly hair',
    art: ({ size, className }) => wrap('#9B5CC4', 'Avatar 4 with curly hair', size, className, (
      <>
        <Shadow />
        <Shoulders shirt="#D89B24" />
        <FaceBase skin="#8A5A3B" />
        <Eyes />
        <Brows />
        <Smile />
        <Cheeks />
        <HairCurly c="#241F1D" />
      </>
    )),
  },
  {
    id: 'av5',
    label: 'Avatar 5',
    art: ({ size, className }) => wrap('#F05A47', 'Avatar 5', size, className, (
      <>
        <Shadow />
        <Shoulders shirt="#53708A" />
        <FaceBase skin="#A96F44" />
        <Eyes />
        <Brows mood="calm" />
        <Smile />
        <Cheeks />
        <HairCap c="#241F1D" />
      </>
    )),
  },
  {
    id: 'av6',
    label: 'Avatar 6',
    art: ({ size, className }) => wrap('#0F766E', 'Avatar 6', size, className, (
      <>
        <Shadow />
        <Shoulders shirt="#F05A47" />
        <FaceBase skin="#FFD9B8" />
        <Eyes />
        <Brows />
        <Smile />
        <Cheeks />
        <HairCap c="#4A3F35" />
      </>
    )),
  },
  {
    id: 'av7',
    label: 'Avatar 7 with glasses',
    art: ({ size, className }) => wrap('#168A72', 'Avatar 7 with glasses', size, className, (
      <>
        <Shadow />
        <Shoulders shirt="#168A72" />
        <FaceBase skin="#E8A97C" />
        <Eyes />
        <Brows />
        <Smile />
        <Cheeks />
        <HairCap c="#2E2A28" />
        <Glasses />
      </>
    )),
  },
  {
    id: 'av8',
    label: 'Avatar 8 with glasses and long hair',
    art: ({ size, className }) => wrap('#9B5CC4', 'Avatar 8 with glasses and long hair', size, className, (
      <>
        <Shadow />
        <Shoulders shirt="#F05A47" />
        <HairLongBehind c="#241F1D" />
        <FaceBase skin="#A96F44" />
        <Eyes />
        <Brows mood="calm" />
        <Smile />
        <Cheeks />
        <HairFringe c="#241F1D" />
        <Glasses />
      </>
    )),
  },
  {
    id: 'av9',
    label: 'Avatar 9 with a hijab',
    art: ({ size, className }) => wrap('#168A72', 'Avatar 9 with a hijab', size, className, (
      <>
        <Shadow />
        <PlainShoulders shirt="#0F766E" />
        <HijabBack color="#0F766E" fold="#7FD1C0" />
        <FaceBase skin="#F5C39B" />
        <Eyes />
        <Brows />
        <Smile />
        <HijabChin color="#0F766E" />
      </>
    )),
  },
  {
    id: 'av10',
    label: 'Avatar 10 with a hijab',
    art: ({ size, className }) => wrap('#F05A47', 'Avatar 10 with a hijab', size, className, (
      <>
        <Shadow />
        <PlainShoulders shirt="#E14B33" />
        <HijabBack color="#E14B33" fold="#FFB3A0" />
        <FaceBase skin="#C98A5E" />
        <Eyes />
        <Brows mood="calm" />
        <Smile />
        <HijabChin color="#E14B33" />
      </>
    )),
  },
  {
    id: 'av11',
    label: 'Avatar 11 with hair puffs',
    art: ({ size, className }) => wrap('#D89B24', 'Avatar 11 with hair puffs', size, className, (
      <>
        <Shadow />
        <Shoulders shirt="#9B5CC4" />
        <FaceBase skin="#C98A5E" />
        <Eyes />
        <Brows />
        <Smile />
        <Cheeks />
        <Puffs c="#241F1D" />
        <HairFringe c="#241F1D" />
      </>
    )),
  },
  {
    id: 'av12',
    label: 'Avatar 12 with long hair',
    art: ({ size, className }) => wrap('#6657C8', 'Avatar 12 with long hair', size, className, (
      <>
        <Shadow />
        <Shoulders shirt="#0F766E" />
        <HairLongBehind c="#3D2817" />
        <FaceBase skin="#FFD9B8" />
        <Eyes />
        <Brows />
        <Smile />
        <Cheeks />
        <HairFringe c="#3D2817" />
      </>
    )),
  },
  {
    id: 'av13',
    label: 'Avatar 13 with braids',
    art: ({ size, className }) => wrap('#168A72', 'Avatar 13 with braids', size, className, (
      <>
        <Shadow />
        <Shoulders shirt="#53708A" />
        <Braids c="#241F1D" />
        <FaceBase skin="#A96F44" />
        <Eyes />
        <Brows />
        <Smile />
        <Cheeks />
        <HairCap c="#241F1D" />
      </>
    )),
  },
  {
    id: 'av14',
    label: 'Avatar 14 with wavy hair',
    art: ({ size, className }) => wrap('#D89B24', 'Avatar 14 with wavy hair', size, className, (
      <>
        <Shadow />
        <Shoulders shirt="#F05A47" />
        <HairLongBehind c="#8A4A2F" />
        <FaceBase skin="#FFD9B8" />
        <Eyes />
        <Brows mood="calm" />
        <Smile />
        <Cheeks />
        <HairCap c="#8A4A2F" />
      </>
    )),
  },
  {
    id: 'av15',
    label: 'Avatar 15 with hair puffs',
    art: ({ size, className }) => wrap('#6657C8', 'Avatar 15 with hair puffs', size, className, (
      <>
        <Shadow />
        <Shoulders shirt="#168A72" />
        <FaceBase skin="#6E4428" />
        <Eyes />
        <Brows mood="calm" />
        <Smile />
        <Cheeks />
        <Puffs c="#1D1613" />
        <HairCap c="#1D1613" />
      </>
    )),
  },
  {
    id: 'av16',
    label: 'Avatar 16 with a fringe and freckles',
    art: ({ size, className }) => wrap('#F05A47', 'Avatar 16 with a fringe and freckles', size, className, (
      <>
        <Shadow />
        <Shoulders shirt="#53708A" />
        <FaceBase skin="#F5C39B" />
        <Eyes />
        <Brows />
        <Smile />
        <Cheeks />
        <Freckles />
        <HairFringe c="#3D2817" />
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
