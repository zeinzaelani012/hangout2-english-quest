// Inline SVG illustrations — no external images, no emoji as artwork

import { extraIllustrations } from '../data/illustrations';
import { renderAvatar } from '../data/avatars';
import wordMapJson from '../data/images/word-map.json';
import imageManifestJson from '../data/images/manifest.json';

// JSON imports arrive as literal object types; the manifest regenerates as
// files land, so treat both as plain lookups.
const wordMap = wordMapJson as unknown as { hintToSlug: Record<string, string> };
const imageManifest = imageManifestJson as unknown as { images: Record<string, string> };

interface SVGProps {
  className?: string;
  size?: number;
}

// Snack Table hero scene — layered illustration
export function SnackTableHero({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 400" className={className} role="img" aria-label="A snack table with food">
      {/* Soft background blobs */}
      <ellipse cx="120" cy="350" rx="100" ry="30" fill="#D89B24" opacity="0.15" />
      <ellipse cx="480" cy="360" rx="120" ry="35" fill="#168A72" opacity="0.12" />
      <ellipse cx="300" cy="380" rx="200" ry="40" fill="#0F766E" opacity="0.06" />

      {/* Table surface */}
      <rect x="80" y="250" width="440" height="12" rx="6" fill="#C4A86F" />
      <rect x="80" y="262" width="440" height="4" rx="2" fill="#A88B50" />
      {/* Table legs */}
      <rect x="100" y="266" width="10" height="90" rx="3" fill="#A88B50" />
      <rect x="490" y="266" width="10" height="90" rx="3" fill="#A88B50" />

      {/* Bowl of fruit */}
      <ellipse cx="180" cy="240" rx="50" ry="14" fill="#0F766E" opacity="0.1" />
      <path d="M140 235 Q140 265 180 270 Q220 265 220 235 Z" fill="#F05A47" opacity="0.85" />
      <ellipse cx="180" cy="235" rx="40" ry="8" fill="#FF8B6A" />
      {/* Apples in bowl */}
      <circle cx="160" cy="225" r="14" fill="#FF4D4D" />
      <circle cx="160" cy="225" r="14" fill="none" stroke="#E83838" strokeWidth="0.5" />
      <path d="M160 211 Q160 207 164 207" stroke="#168A72" strokeWidth="3" fill="none" />
      {/* Bananas in bowl */}
      <path d="M180 215 Q200 205 210 220 Q195 225 180 215 Z" fill="#FFD93D" />
      <path d="M182 217 Q198 210 207 220" stroke="#E8C32D" strokeWidth="1" fill="none" />
      {/* Grapes */}
      <circle cx="195" cy="228" r="5" fill="#9B59B6" />
      <circle cx="200" cy="232" r="5" fill="#9B59B6" />
      <circle cx="190" cy="232" r="5" fill="#8E44AD" />

      {/* Cup */}
      <path d="M260 210 L265 255 L295 255 L300 210 Z" fill="#6657C8" opacity="0.7" />
      <ellipse cx="280" cy="210" rx="20" ry="5" fill="#6657C8" opacity="0.5" />
      <path d="M300 215 Q315 220 315 235 Q315 245 300 245" stroke="#6657C8" strokeWidth="3" fill="none" />
      {/* Liquid in cup */}
      <ellipse cx="280" cy="212" rx="17" ry="3" fill="#D89B24" opacity="0.6" />

      {/* Popcorn box */}
      <path d="M350 220 L355 260 L395 260 L400 220 Z" fill="#F05A47" />
      <path d="M350 220 L355 260 L395 260 L400 220 Z" fill="none" stroke="#E8553A" strokeWidth="1" />
      {/* Stripes */}
      <rect x="362" y="220" width="4" height="40" fill="#FFFFFF" opacity="0.5" />
      <rect x="378" y="220" width="4" height="40" fill="#FFFFFF" opacity="0.5" />
      {/* Popcorn kernels */}
      <circle cx="360" cy="215" r="8" fill="#FFFBF0" />
      <circle cx="375" cy="212" r="9" fill="#FFF5E8" />
      <circle cx="390" cy="215" r="8" fill="#FFFBF0" />
      <circle cx="368" cy="205" r="7" fill="#FFFAF0" />
      <circle cx="382" cy="205" r="7" fill="#FFF8EC" />

      {/* Cookie */}
      <circle cx="445" cy="240" r="22" fill="#D4A574" />
      <circle cx="445" cy="240" r="22" fill="none" stroke="#B88A5A" strokeWidth="1" />
      {/* Chocolate chips */}
      <circle cx="438" cy="233" r="4" fill="#3D2817" />
      <circle cx="452" cy="235" r="4" fill="#3D2817" />
      <circle cx="442" cy="247" r="4" fill="#3D2817" />
      <circle cx="455" cy="246" r="3" fill="#3D2817" />
      <circle cx="435" cy="245" r="3" fill="#3D2817" />

      {/* Plate with small fruit */}
      <ellipse cx="520" cy="245" rx="45" ry="10" fill="#F0F0F0" />
      <ellipse cx="520" cy="242" rx="40" ry="8" fill="#FFFFFF" />
      {/* Tomato */}
      <circle cx="510" cy="232" r="12" fill="#FF4D4D" />
      <path d="M510 220 L510 225 M506 222 L514 222" stroke="#168A72" strokeWidth="2" />
      {/* Apple */}
      <circle cx="530" cy="232" r="12" fill="#FFD93D" />
      <path d="M530 220 Q530 216 534 216" stroke="#168A72" strokeWidth="2" fill="none" />

      {/* Floating decorative dots */}
      <circle cx="100" cy="120" r="4" fill="#D89B24" opacity="0.4" />
      <circle cx="540" cy="100" r="5" fill="#168A72" opacity="0.3" />
      <circle cx="80" cy="80" r="3" fill="#F05A47" opacity="0.3" />
      <circle cx="520" cy="70" r="4" fill="#6657C8" opacity="0.3" />
    </svg>
  );
}

// Cookie-crumb mascot — small round character
export function CookieMascot({ className = '', size = 48 }: SVGProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label="Cookie mascot">
      <circle cx="32" cy="32" r="28" fill="#D4A574" />
      <circle cx="32" cy="32" r="28" fill="none" stroke="#B88A5A" strokeWidth="1.5" />
      {/* Chocolate chip eyes */}
      <circle cx="24" cy="26" r="4" fill="#3D2817" />
      <circle cx="40" cy="26" r="4" fill="#3D2817" />
      {/* Smile */}
      <path d="M24 38 Q32 44 40 38" stroke="#3D2817" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Chocolate chips on body */}
      <circle cx="20" cy="40" r="2.5" fill="#3D2817" />
      <circle cx="44" cy="42" r="2.5" fill="#3D2817" />
      <circle cx="32" cy="48" r="2" fill="#3D2817" />
    </svg>
  );
}

// Station badge SVGs — one per skill + boss
export function StationBadge({ skill, size = 56, className = '' }: { skill: string; size?: number; className?: string }) {
  const colorMap: Record<string, string> = {
    speaking: '#F05A47',
    vocabulary: '#D89B24',
    listening: '#6657C8',
    reading: '#168A72',
    writing: '#9B5CC4',
    grammar: '#53708A',
    boss: '#0F766E',
    mixed: '#0F766E',
  };
  const color = colorMap[skill] || '#0F766E';

  const icons: Record<string, JSX.Element> = {
    vocabulary: (
      <>
        <rect x="14" y="10" width="24" height="30" rx="3" fill="white" opacity="0.9" />
        <line x1="18" y1="18" x2="34" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="18" y1="24" x2="30" y2="24" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="18" y1="30" x2="32" y2="30" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    grammar: (
      <>
        <circle cx="26" cy="26" r="14" fill="white" opacity="0.9" />
        <path d="M20 22 L32 22 M20 26 L32 26 M20 30 L28 30" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    listening: (
      <>
        <path d="M18 22 Q18 16 26 16 Q34 16 34 22 L34 30 Q34 34 30 35 L30 40 L22 40 L22 35 Q18 34 18 30 Z" fill="white" opacity="0.9" />
      </>
    ),
    reading: (
      <>
        <rect x="12" y="12" width="28" height="24" rx="2" fill="white" opacity="0.9" />
        <path d="M12 12 L26 20 L40 12" fill="none" stroke={color} strokeWidth="2" />
      </>
    ),
    writing: (
      <>
        <rect x="14" y="10" width="20" height="28" rx="2" fill="white" opacity="0.9" transform="rotate(-10 24 24)" />
        <line x1="20" y1="14" x2="36" y2="38" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      </>
    ),
    speaking: (
      <>
        <rect x="20" y="14" width="12" height="20" rx="6" fill="white" opacity="0.9" />
        <path d="M16 26 Q16 36 26 36 Q36 36 36 26" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="26" y1="36" x2="26" y2="42" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    boss: (
      <>
        <path d="M26 12 L32 20 L38 12 L36 24 L44 26 L36 30 L38 40 L26 34 L14 40 L16 30 L8 26 L16 24 Z" fill="white" opacity="0.9" />
        <text x="26" y="30" fontSize="12" fontWeight="bold" fill={color} textAnchor="middle">★</text>
      </>
    ),
    mixed: (
      <>
        <circle cx="26" cy="26" r="12" fill="white" opacity="0.9" />
        <text x="26" y="31" fontSize="14" fontWeight="bold" fill={color} textAnchor="middle">★</text>
      </>
    ),
  };

  return (
    <svg viewBox="0 0 52 52" width={size} height={size} className={className} role="img" aria-label={`${skill} badge`}>
      <circle cx="26" cy="26" r="24" fill={color} />
      <circle cx="26" cy="26" r="24" fill="none" stroke={color} strokeWidth="1" opacity="0.3" />
      {icons[skill] || icons.mixed}
    </svg>
  );
}

// Vocab illustration — builds a simple inline SVG from imgHint
export function VocabIllustration({ imgHint, className = '', size = 80 }: { imgHint: string; className?: string; size?: number }) {
  const hint = imgHint.toLowerCase();
  const s = size;

  // User-supplied image pack first (public/img/words, registered by
  // scripts/build-image-manifest.mjs). A word without a file falls through
  // to the SVG chain below, so the pack can land gradually.
  const slug = wordMap.hintToSlug[hint];
  const file = slug !== undefined ? imageManifest.images[slug] : undefined;
  if (file) {
    return (
      <img
        src={file}
        alt={imgHint}
        width={s}
        height={s}
        loading="lazy"
        draggable={false}
        className={className}
        style={{ objectFit: 'contain' }}
      />
    );
  }

  // Unit packs can register their own artwork in src/data/illustrations.tsx;
  // that registry is checked first so units stay pure data.
  for (const [keyword, Art] of Object.entries(extraIllustrations)) {
    if (hint.includes(keyword)) return <Art size={s} className={className} />;
  }

  // Determine illustration type from hint
  if (hint.includes('popcorn')) return <PopcornSVG size={s} className={className} />;
  if (hint.includes('cookie')) return <CookieSVG size={s} className={className} />;
  if (hint.includes('candy')) return <CandySVG size={s} className={className} />;
  if (hint.includes('soda') || hint.includes('fizzy')) return <SodaSVG size={s} className={className} />;
  if (hint.includes('fries') || hint.includes('potato')) return <FriesSVG size={s} className={className} />;
  if (hint.includes('chocolate')) return <ChocolateSVG size={s} className={className} />;
  if (hint.includes('apple')) return <AppleSVG size={s} className={className} />;
  if (hint.includes('banana')) return <BananaSVG size={s} className={className} />;
  if (hint.includes('tomato')) return <TomatoSVG size={s} className={className} />;
  if (hint.includes('milk')) return <MilkSVG size={s} className={className} />;
  if (hint.includes('yogurt')) return <YogurtSVG size={s} className={className} />;
  if (hint.includes('cereal') || hint.includes('flake')) return <CerealSVG size={s} className={className} />;
  if (hint.includes('rice')) return <RiceSVG size={s} className={className} />;
  if (hint.includes('soup')) return <SoupSVG size={s} className={className} />;
  if (hint.includes('fruit') || hint.includes('grape')) return <FruitBowlSVG size={s} className={className} />;
  if (hint.includes('vegetable') || hint.includes('carrot') || hint.includes('broccoli')) return <VegSVG size={s} className={className} />;
  if (hint.includes('plant') || hint.includes('potted')) return <PlantSVG size={s} className={className} />;
  if (hint.includes('vine')) return <VineSVG size={s} className={className} />;
  if (hint.includes('ground') || hint.includes('soil')) return <GroundSVG size={s} className={className} />;
  if (hint.includes('farm') || hint.includes('barn')) return <FarmSVG size={s} className={className} />;
  if (hint.includes('garden')) return <GardenSVG size={s} className={className} />;
  if (hint.includes('juice')) return <JuiceSVG size={s} className={className} />;
  if (hint.includes('strawberr')) return <StrawberrySVG size={s} className={className} />;
  if (hint.includes('watermelon')) return <WatermelonSVG size={s} className={className} />;

  // Default: a simple geometric shape
  return (
    <svg viewBox="0 0 80 80" width={s} height={s} className={className} role="img" aria-label={imgHint}>
      <circle cx="40" cy="40" r="30" fill="#D89B24" opacity="0.3" />
      <circle cx="40" cy="40" r="20" fill="#F05A47" opacity="0.4" />
    </svg>
  );
}

// Individual vocab SVGs
function PopcornSVG({ size, className }: SVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="popcorn">
      <path d="M20 35 L24 70 L56 70 L60 35 Z" fill="#F05A47" />
      <rect x="30" y="35" width="3" height="35" fill="#FFFFFF" opacity="0.4" />
      <rect x="42" y="35" width="3" height="35" fill="#FFFFFF" opacity="0.4" />
      <circle cx="28" cy="30" r="8" fill="#FFFBF0" />
      <circle cx="40" cy="25" r="10" fill="#FFF8EC" />
      <circle cx="52" cy="30" r="8" fill="#FFFBF0" />
      <circle cx="34" cy="18" r="7" fill="#FFFAF0" />
      <circle cx="46" cy="18" r="7" fill="#FFF8EC" />
    </svg>
  );
}

function CookieSVG({ size, className }: SVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="cookies">
      <circle cx="28" cy="50" r="20" fill="#D4A574" stroke="#B88A5A" strokeWidth="1" />
      <circle cx="22" cy="45" r="3" fill="#3D2817" />
      <circle cx="32" cy="48" r="3" fill="#3D2817" />
      <circle cx="28" cy="55" r="3" fill="#3D2817" />
      <circle cx="56" cy="32" r="18" fill="#D4A574" stroke="#B88A5A" strokeWidth="1" />
      <circle cx="50" cy="28" r="3" fill="#3D2817" />
      <circle cx="60" cy="30" r="3" fill="#3D2817" />
      <circle cx="56" cy="36" r="3" fill="#3D2817" />
    </svg>
  );
}

function CandySVG({ size, className }: SVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="candy">
      <ellipse cx="40" cy="40" rx="18" ry="12" fill="#F05A47" />
      <path d="M22 40 L12 30 L12 50 Z" fill="#F05A47" />
      <path d="M58 40 L68 30 L68 50 Z" fill="#F05A47" />
      <line x1="30" y1="36" x2="50" y2="44" stroke="#FFFFFF" strokeWidth="2" opacity="0.5" />
      <line x1="30" y1="44" x2="50" y2="36" stroke="#FFFFFF" strokeWidth="2" opacity="0.5" />
    </svg>
  );
}

function SodaSVG({ size, className }: SVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="soda">
      <path d="M28 15 L52 15 L50 70 L30 70 Z" fill="#6657C8" opacity="0.7" />
      <ellipse cx="40" cy="15" rx="12" ry="3" fill="#6657C8" opacity="0.5" />
      <circle cx="38" cy="30" r="3" fill="#FFFFFF" opacity="0.6" />
      <circle cx="44" cy="40" r="2" fill="#FFFFFF" opacity="0.6" />
      <circle cx="35" cy="50" r="2.5" fill="#FFFFFF" opacity="0.6" />
      <line x1="40" y1="15" x2="40" y2="5" stroke="#F05A47" strokeWidth="2" />
    </svg>
  );
}

function FriesSVG({ size, className }: SVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="fries">
      <path d="M20 40 L25 70 L55 70 L60 40 Z" fill="#F05A47" />
      <rect x="28" y="15" width="4" height="35" rx="1" fill="#FFD93D" />
      <rect x="35" y="10" width="4" height="40" rx="1" fill="#FFD93D" />
      <rect x="42" y="12" width="4" height="38" rx="1" fill="#FFD93D" />
      <rect x="49" y="15" width="4" height="35" rx="1" fill="#FFD93D" />
    </svg>
  );
}

function ChocolateSVG({ size, className }: SVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="chocolate">
      <rect x="18" y="20" width="44" height="40" rx="4" fill="#5D3A1A" />
      <line x1="18" y1="33" x2="62" y2="33" stroke="#4A2E15" strokeWidth="1.5" />
      <line x1="18" y1="46" x2="62" y2="46" stroke="#4A2E15" strokeWidth="1.5" />
      <line x1="32" y1="20" x2="32" y2="60" stroke="#4A2E15" strokeWidth="1.5" />
      <line x1="48" y1="20" x2="48" y2="60" stroke="#4A2E15" strokeWidth="1.5" />
    </svg>
  );
}

function AppleSVG({ size, className }: SVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="apple">
      <circle cx="40" cy="45" r="24" fill="#FF4D4D" />
      <path d="M40 22 Q40 16 46 14" stroke="#168A72" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="48" cy="20" rx="6" ry="3" fill="#168A72" />
    </svg>
  );
}

function BananaSVG({ size, className }: SVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="banana">
      <path d="M20 20 Q50 15 60 40 Q65 60 45 65 Q40 50 30 40 Q22 30 20 20 Z" fill="#FFD93D" stroke="#E8C32D" strokeWidth="1" />
      <path d="M20 20 Q50 15 60 40" fill="none" stroke="#E8C32D" strokeWidth="0.5" opacity="0.5" />
    </svg>
  );
}

function TomatoSVG({ size, className }: SVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="tomato">
      <circle cx="40" cy="45" r="24" fill="#FF4D4D" />
      <path d="M30 25 L40 20 L50 25 L48 30 L32 30 Z" fill="#168A72" />
      <circle cx="40" cy="25" r="3" fill="#168A72" />
    </svg>
  );
}

function MilkSVG({ size, className }: SVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="milk">
      <path d="M28 18 L52 18 L50 70 L30 70 Z" fill="#FFFFFF" stroke="#DCE2EA" strokeWidth="1" />
      <rect x="30" y="35" width="20" height="15" fill="#6657C8" opacity="0.15" />
      <text x="40" y="46" fontSize="8" fill="#0F766E" textAnchor="middle" fontWeight="bold">MILK</text>
    </svg>
  );
}

function YogurtSVG({ size, className }: SVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="yogurt">
      <path d="M25 30 L55 30 L52 68 L28 68 Z" fill="#F05A47" opacity="0.8" />
      <ellipse cx="40" cy="30" rx="15" ry="4" fill="#FFFFFF" />
      <circle cx="40" cy="28" r="2" fill="#F05A47" />
      <line x1="40" y1="30" x2="40" y2="10" stroke="#D4A574" strokeWidth="2" />
    </svg>
  );
}

function CerealSVG({ size, className }: SVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="cereal">
      <ellipse cx="40" cy="40" rx="30" ry="25" fill="#F05A47" opacity="0.2" />
      <ellipse cx="40" cy="35" rx="28" ry="22" fill="#FFFFFF" />
      <ellipse cx="40" cy="35" rx="28" ry="22" fill="none" stroke="#DCE2EA" strokeWidth="1" />
      {/* Flakes */}
      <ellipse cx="30" cy="30" rx="5" ry="3" fill="#D4A574" />
      <ellipse cx="45" cy="28" rx="5" ry="3" fill="#D4A574" />
      <ellipse cx="38" cy="38" rx="5" ry="3" fill="#D4A574" />
      <ellipse cx="50" cy="38" rx="5" ry="3" fill="#D4A574" />
      {/* Milk */}
      <ellipse cx="40" cy="42" rx="25" ry="5" fill="#FFFFFF" opacity="0.6" />
    </svg>
  );
}

function RiceSVG({ size, className }: SVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="rice">
      <ellipse cx="40" cy="50" rx="28" ry="18" fill="#0F766E" opacity="0.1" />
      <path d="M18 35 Q18 60 40 65 Q62 60 62 35 Z" fill="#FFFFFF" stroke="#DCE2EA" strokeWidth="1" />
      <ellipse cx="40" cy="35" rx="22" ry="6" fill="#FFFFFF" />
      {/* Rice grains */}
      <ellipse cx="32" cy="33" rx="2" ry="1" fill="#DCE2EA" />
      <ellipse cx="40" cy="32" rx="2" ry="1" fill="#DCE2EA" />
      <ellipse cx="48" cy="33" rx="2" ry="1" fill="#DCE2EA" />
    </svg>
  );
}

function SoupSVG({ size, className }: SVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="soup">
      <ellipse cx="40" cy="50" rx="30" ry="20" fill="#0F766E" opacity="0.1" />
      <path d="M15 35 Q15 60 40 65 Q65 60 65 35 Z" fill="#F05A47" opacity="0.7" />
      <ellipse cx="40" cy="35" rx="25" ry="7" fill="#FF8B6A" />
      <circle cx="35" cy="33" r="3" fill="#FFD93D" />
      <circle cx="45" cy="35" r="3" fill="#168A72" />
      {/* Steam */}
      <path d="M30 20 Q28 15 32 10" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.5" />
      <path d="M40 18 Q38 13 42 8" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.5" />
      <path d="M50 20 Q48 15 52 10" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.5" />
    </svg>
  );
}

function FruitBowlSVG({ size, className }: SVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="fruit bowl">
      <path d="M15 40 Q15 65 40 68 Q65 65 65 40 Z" fill="#0F766E" opacity="0.15" />
      <path d="M15 40 Q15 60 40 65 Q65 60 65 40 Z" fill="#F05A47" opacity="0.5" />
      <ellipse cx="40" cy="40" rx="25" ry="5" fill="#FF8B6A" />
      <circle cx="30" cy="35" r="8" fill="#FF4D4D" />
      <path d="M30 28 Q30 25 34 24" stroke="#168A72" strokeWidth="2" fill="none" />
      <circle cx="48" cy="33" r="7" fill="#FFD93D" />
      <circle cx="40" cy="30" r="6" fill="#9B59B6" />
      <circle cx="44" cy="32" r="5" fill="#8E44AD" />
    </svg>
  );
}

function VegSVG({ size, className }: SVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="vegetables">
      {/* Carrot */}
      <path d="M20 25 L30 55 L15 55 Z" fill="#F05A47" />
      <path d="M18 20 L22 15 M22 20 L26 15 M25 22 L29 17" stroke="#168A72" strokeWidth="2" />
      {/* Broccoli */}
      <circle cx="55" cy="30" r="10" fill="#168A72" />
      <circle cx="50" cy="35" r="7" fill="#168A72" />
      <circle cx="60" cy="35" r="7" fill="#168A72" />
      <rect x="52" y="38" width="6" height="20" fill="#168A72" opacity="0.7" />
    </svg>
  );
}

function PlantSVG({ size, className }: SVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="plant">
      <path d="M25 50 L55 50 L52 70 L28 70 Z" fill="#9B5CC4" opacity="0.3" />
      <rect x="22" y="45" width="36" height="8" rx="2" fill="#9B5CC4" opacity="0.4" />
      <path d="M40 45 L40 25" stroke="#168A72" strokeWidth="3" />
      <ellipse cx="32" cy="30" rx="10" ry="6" fill="#168A72" transform="rotate(-30 32 30)" />
      <ellipse cx="48" cy="28" rx="10" ry="6" fill="#168A72" transform="rotate(30 48 28)" />
      <ellipse cx="40" cy="20" rx="8" ry="5" fill="#168A72" />
    </svg>
  );
}

function VineSVG({ size, className }: SVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="vine">
      <path d="M15 60 Q30 40 40 50 Q50 60 65 30" stroke="#168A72" strokeWidth="3" fill="none" />
      <circle cx="30" cy="48" r="5" fill="#168A72" />
      <circle cx="50" cy="50" r="5" fill="#168A72" />
      <circle cx="60" cy="35" r="5" fill="#168A72" />
      <ellipse cx="25" cy="52" rx="6" ry="3" fill="#168A72" opacity="0.6" transform="rotate(-20 25 52)" />
      <ellipse cx="45" cy="54" rx="6" ry="3" fill="#168A72" opacity="0.6" transform="rotate(15 45 54)" />
    </svg>
  );
}

function GroundSVG({ size, className }: SVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="ground">
      <rect x="10" y="40" width="60" height="30" rx="4" fill="#8B6F47" />
      <rect x="10" y="40" width="60" height="8" rx="4" fill="#A88B5A" />
      <circle cx="20" cy="50" r="2" fill="#6B5A3F" />
      <circle cx="35" cy="55" r="2" fill="#6B5A3F" />
      <circle cx="55" cy="52" r="2" fill="#6B5A3F" />
      <circle cx="60" cy="60" r="2" fill="#6B5A3F" />
      <ellipse cx="15" cy="38" rx="8" ry="4" fill="#168A72" opacity="0.6" />
      <ellipse cx="50" cy="38" rx="10" ry="4" fill="#168A72" opacity="0.6" />
      <ellipse cx="70" cy="40" rx="6" ry="3" fill="#168A72" opacity="0.6" />
    </svg>
  );
}

function FarmSVG({ size, className }: SVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="farm">
      <rect x="10" y="50" width="60" height="20" fill="#168A72" opacity="0.3" />
      {/* Barn */}
      <rect x="25" y="25" width="25" height="25" fill="#F05A47" />
      <path d="M22 25 L37 12 L52 25 Z" fill="#F05A47" />
      <rect x="33" y="35" width="9" height="15" fill="#5D3A1A" />
      {/* Fence */}
      <line x1="10" y1="45" x2="55" y2="45" stroke="#8B6F47" strokeWidth="1.5" />
      <line x1="15" y1="40" x2="15" y2="50" stroke="#8B6F47" strokeWidth="1.5" />
      <line x1="50" y1="40" x2="50" y2="50" stroke="#8B6F47" strokeWidth="1.5" />
    </svg>
  );
}

function GardenSVG({ size, className }: SVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="garden">
      <rect x="10" y="45" width="60" height="25" rx="4" fill="#8B6F47" opacity="0.6" />
      <circle cx="25" cy="40" r="8" fill="#FF4D4D" />
      <path d="M25 33 Q25 30 28 29" stroke="#168A72" strokeWidth="2" />
      <circle cx="45" cy="38" r="7" fill="#FFD93D" />
      <circle cx="55" cy="42" r="6" fill="#9B59B6" />
      <path d="M20 50 L20 55 M30 50 L30 55 M40 50 L40 55 M50 50 L50 55 M60 50 L60 55" stroke="#168A72" strokeWidth="2" opacity="0.5" />
    </svg>
  );
}

function JuiceSVG({ size, className }: SVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="juice">
      <path d="M28 18 L52 18 L50 65 L30 65 Z" fill="#D89B24" opacity="0.7" />
      <ellipse cx="40" cy="18" rx="12" ry="3" fill="#D89B24" opacity="0.5" />
      <line x1="40" y1="18" x2="40" y2="8" stroke="#F05A47" strokeWidth="2" />
    </svg>
  );
}

function StrawberrySVG({ size, className }: SVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="strawberry">
      <path d="M40 20 Q25 25 25 45 Q25 60 40 65 Q55 60 55 45 Q55 25 40 20 Z" fill="#FF4D4D" />
      <path d="M30 18 L40 12 L50 18 L46 24 L34 24 Z" fill="#168A72" />
      <circle cx="35" cy="35" r="1.5" fill="#FFD93D" />
      <circle cx="45" cy="35" r="1.5" fill="#FFD93D" />
      <circle cx="40" cy="42" r="1.5" fill="#FFD93D" />
      <circle cx="33" cy="48" r="1.5" fill="#FFD93D" />
      <circle cx="47" cy="48" r="1.5" fill="#FFD93D" />
    </svg>
  );
}

function WatermelonSVG({ size, className }: SVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="watermelon">
      <ellipse cx="40" cy="45" rx="28" ry="22" fill="#168A72" />
      <ellipse cx="40" cy="45" rx="24" ry="18" fill="#FFFFFF" />
      <ellipse cx="40" cy="45" rx="20" ry="14" fill="#FF4D4D" />
      <ellipse cx="32" cy="40" rx="2" ry="3" fill="#3D2817" />
      <ellipse cx="45" cy="42" rx="2" ry="3" fill="#3D2817" />
      <ellipse cx="38" cy="48" rx="2" ry="3" fill="#3D2817" />
      <ellipse cx="48" cy="50" rx="2" ry="3" fill="#3D2817" />
    </svg>
  );
}

// Avatar rendering — art lives in the data registry (src/data/avatars.tsx)
export function AvatarSVG({ avatarId, size = 64, className = '' }: { avatarId: string; size?: number; className?: string }) {
  return renderAvatar(avatarId, size, className) || null;
}

export { AVATAR_IDS } from '../data/avatars';
