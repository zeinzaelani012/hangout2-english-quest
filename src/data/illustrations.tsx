// Data-owned illustration registry.
//
// VocabIllustration checks this registry BEFORE its built-in hint chain, so
// units can bring their own artwork by adding entries here — no component
// changes needed. Keys are matched against the lowercased imgHint with
// String.includes, in insertion order (put longer keys first: 't-shirt'
// before 'shirt').

interface RegistrySVGProps {
  className?: string;
  size?: number;
}

function TShirtSVG({ size = 80, className }: RegistrySVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="t-shirt">
      <path d="M28 16 L36 12 Q40 18 44 12 L52 16 L62 26 L55 33 L54 64 L26 64 L25 33 L18 26 Z" fill="#2FB59A" />
      <path d="M36 12 Q40 18 44 12" fill="none" stroke="#268F79" strokeWidth="2" />
    </svg>
  );
}

function ShirtSVG({ size = 80, className }: RegistrySVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="shirt">
      <path d="M28 16 L36 12 Q40 18 44 12 L52 16 L62 26 L55 33 L54 64 L26 64 L25 33 L18 26 Z" fill="#7C5CFF" />
      <line x1="40" y1="20" x2="40" y2="64" stroke="#5B3FC4" strokeWidth="1.5" />
      <circle cx="40" cy="30" r="1.8" fill="#FFFBF5" />
      <circle cx="40" cy="40" r="1.8" fill="#FFFBF5" />
      <circle cx="40" cy="50" r="1.8" fill="#FFFBF5" />
    </svg>
  );
}

function PantsSVG({ size = 80, className }: RegistrySVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="pants">
      <path d="M25 14 H55 V30 L51 66 H42 L40 40 L38 66 H29 L25 30 Z" fill="#2B3A8F" />
      <rect x="25" y="14" width="30" height="5" rx="2" fill="#1D2968" />
    </svg>
  );
}

function SkirtSVG({ size = 80, className }: RegistrySVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="skirt">
      <rect x="29" y="18" width="22" height="8" rx="3" fill="#1D2968" />
      <path d="M29 26 L20 60 H60 L51 26 Z" fill="#FF6B4A" />
    </svg>
  );
}

function DressSVG({ size = 80, className }: RegistrySVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="dress">
      <path d="M32 14 L30 34 L22 64 H58 L50 34 L48 14 Z" fill="#C77DFF" />
      <line x1="32" y1="14" x2="35" y2="8" stroke="#A852E8" strokeWidth="2" />
      <line x1="48" y1="14" x2="45" y2="8" stroke="#A852E8" strokeWidth="2" />
      <line x1="26" y1="52" x2="54" y2="52" stroke="#A852E8" strokeWidth="1.5" />
    </svg>
  );
}

function ShortsSVG({ size = 80, className }: RegistrySVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="shorts">
      <path d="M25 20 H55 V32 L50 52 H42 L40 38 L38 52 H30 L25 32 Z" fill="#FFC145" />
      <rect x="25" y="20" width="30" height="5" rx="2" fill="#D9A12F" />
    </svg>
  );
}

function SocksSVG({ size = 80, className }: RegistrySVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="socks">
      <path d="M30 12 H44 V40 Q44 52 56 56 Q62 58 60 64 Q58 70 50 68 Q34 64 30 48 Z" fill="#FF6B4A" />
      <rect x="30" y="12" width="14" height="6" rx="2" fill="#D9502F" />
    </svg>
  );
}

function ShoeSVG({ size = 80, className }: RegistrySVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="shoes">
      <path d="M18 52 Q20 36 34 36 L42 36 Q52 36 60 46 L64 52 Q66 56 62 58 L20 58 Q16 56 18 52 Z" fill="#2B3A8F" />
      <rect x="16" y="56" width="52" height="6" rx="3" fill="#12172B" />
      <line x1="36" y1="40" x2="44" y2="46" stroke="#FFFBF5" strokeWidth="1.5" />
      <line x1="34" y1="46" x2="42" y2="52" stroke="#FFFBF5" strokeWidth="1.5" />
    </svg>
  );
}

function SneakerSVG({ size = 80, className }: RegistrySVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="sneakers">
      <path d="M18 50 Q20 34 34 34 L42 34 Q52 34 60 44 L64 50 Q66 54 62 56 L20 56 Q16 54 18 50 Z" fill="#2FB59A" />
      <rect x="16" y="54" width="52" height="6" rx="3" fill="#FFFBF5" />
      <path d="M34 38 L42 42 M32 44 L40 48 M44 34 L52 40" stroke="#1D8A73" strokeWidth="1.5" />
    </svg>
  );
}

function SweaterSVG({ size = 80, className }: RegistrySVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="sweater">
      <path d="M28 16 L36 12 Q40 18 44 12 L52 16 L60 22 L64 48 L56 51 L54 64 L26 64 L24 51 L16 48 L20 22 Z" fill="#FFC145" />
      <path d="M36 12 Q40 18 44 12" fill="none" stroke="#D9A12F" strokeWidth="2" />
      <rect x="24" y="60" width="30" height="4" rx="2" fill="#D9A12F" />
    </svg>
  );
}

function JacketSVG({ size = 80, className }: RegistrySVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="jacket">
      <path d="M28 16 L36 12 Q40 18 44 12 L52 16 L62 26 L55 33 L54 64 L26 64 L25 33 L18 26 Z" fill="#5B7C99" />
      <line x1="40" y1="18" x2="40" y2="64" stroke="#48657E" strokeWidth="2" />
      <rect x="28" y="46" width="8" height="10" rx="2" fill="#48657E" />
      <rect x="44" y="46" width="8" height="10" rx="2" fill="#48657E" />
    </svg>
  );
}

function CoatSVG({ size = 80, className }: RegistrySVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="coat">
      <path d="M28 16 L36 12 Q40 18 44 12 L52 16 L62 26 L55 33 L54 70 L26 70 L25 33 L18 26 Z" fill="#2B3A8F" />
      <line x1="40" y1="18" x2="40" y2="70" stroke="#1D2968" strokeWidth="2" />
      <circle cx="36" cy="32" r="1.8" fill="#FFC145" />
      <circle cx="36" cy="44" r="1.8" fill="#FFC145" />
      <circle cx="36" cy="56" r="1.8" fill="#FFC145" />
    </svg>
  );
}

function BootSVG({ size = 80, className }: RegistrySVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="boots">
      <path d="M28 12 H46 V40 Q46 48 56 50 L62 52 Q66 54 64 58 L26 58 Q24 54 26 48 Z" fill="#5D3A1A" />
      <rect x="24" y="56" width="42" height="6" rx="3" fill="#3D2817" />
      <rect x="28" y="12" width="18" height="5" rx="2" fill="#8A5A2E" />
    </svg>
  );
}

function HatSVG({ size = 80, className }: RegistrySVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="hat">
      <path d="M24 42 Q24 20 40 20 Q56 20 56 42 Z" fill="#FF6B4A" />
      <path d="M40 22 L58 46 L24 46 Z" fill="#FFC145" opacity="0.85" />
      <rect x="14" y="42" width="52" height="7" rx="3.5" fill="#D9502F" />
      <circle cx="40" cy="21" r="3" fill="#D9502F" />
    </svg>
  );
}

function ScarfSVG({ size = 80, className }: RegistrySVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="scarf">
      <path d="M20 22 Q40 34 60 22 L60 32 Q40 44 20 32 Z" fill="#7C5CFF" />
      <rect x="44" y="30" width="10" height="34" rx="4" fill="#5B3FC4" />
      <line x1="46" y1="38" x2="52" y2="38" stroke="#FFFBF5" strokeWidth="1.5" opacity="0.6" />
      <line x1="46" y1="46" x2="52" y2="46" stroke="#FFFBF5" strokeWidth="1.5" opacity="0.6" />
      <line x1="46" y1="54" x2="52" y2="54" stroke="#FFFBF5" strokeWidth="1.5" opacity="0.6" />
    </svg>
  );
}

function GlovesSVG({ size = 80, className }: RegistrySVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="gloves">
      <path d="M28 26 Q28 18 34 18 Q40 18 40 26 L40 20 Q40 14 45 14 Q50 14 50 20 L50 40 Q50 52 42 54 L42 62 L34 62 L34 50 Q28 46 28 36 Z" fill="#2FB59A" />
      <rect x="33" y="56" width="10" height="6" rx="2" fill="#1D8A73" />
    </svg>
  );
}

function UniformSVG({ size = 80, className }: RegistrySVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="uniform">
      <path d="M28 16 L36 12 Q40 18 44 12 L52 16 L62 26 L55 33 L54 64 L26 64 L25 33 L18 26 Z" fill="#2B3A8F" />
      <path d="M40 22 L44 30 L40 52 L36 30 Z" fill="#FF6B4A" />
      <path d="M36 12 L40 22 L44 12" fill="none" stroke="#FFFBF5" strokeWidth="1.5" />
    </svg>
  );
}

function PajamasSVG({ size = 80, className }: RegistrySVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="pajamas">
      <path d="M28 16 L36 12 Q40 18 44 12 L52 16 L62 26 L55 33 L54 64 L26 64 L25 33 L18 26 Z" fill="#7C5CFF" />
      <path d="M44 32 A10 10 0 1 0 50 46 A8 8 0 0 1 44 32" fill="#FFC145" />
      <circle cx="32" cy="38" r="1.5" fill="#FFFBF5" opacity="0.7" />
    </svg>
  );
}

function SwimsuitSVG({ size = 80, className }: RegistrySVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="swimsuit">
      <path d="M32 16 L32 24 L28 34 Q24 46 30 60 H50 Q56 46 52 34 L48 24 L48 16" fill="none" stroke="#FF6B4A" strokeWidth="3" />
      <path d="M30 34 Q40 40 50 34 Q56 46 50 60 H30 Q24 46 30 34 Z" fill="#FF6B4A" />
    </svg>
  );
}

function BeltSVG({ size = 80, className }: RegistrySVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="belt">
      <rect x="10" y="34" width="60" height="12" rx="4" fill="#5D3A1A" />
      <rect x="34" y="30" width="12" height="20" rx="3" fill="#FFC145" stroke="#D9A12F" strokeWidth="1.5" />
      <circle cx="40" cy="40" r="2.5" fill="#5D3A1A" />
    </svg>
  );
}

function GlassesSVG({ size = 80, className }: RegistrySVGProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} role="img" aria-label="glasses">
      <circle cx="26" cy="42" r="12" fill="none" stroke="#12172B" strokeWidth="3" />
      <circle cx="54" cy="42" r="12" fill="none" stroke="#12172B" strokeWidth="3" />
      <path d="M38 42 Q40 38 42 42" fill="none" stroke="#12172B" strokeWidth="3" />
      <line x1="14" y1="42" x2="8" y2="38" stroke="#12172B" strokeWidth="3" />
      <line x1="66" y1="42" x2="72" y2="38" stroke="#12172B" strokeWidth="3" />
    </svg>
  );
}

/**
 * Keyword → artwork. Checked with hint.includes(key) in insertion order,
 * so put longer/more specific keys before shorter ones.
 */
export const extraIllustrations: Record<string, (props: RegistrySVGProps) => JSX.Element> = {
  't-shirt': TShirtSVG,
  'tshirt': TShirtSVG,
  'short sleeve': TShirtSVG,
  'shirt': ShirtSVG,
  'pants': PantsSVG,
  'trousers': PantsSVG,
  'jeans': PantsSVG,
  'skirt': SkirtSVG,
  'dress': DressSVG,
  'shorts': ShortsSVG,
  'socks': SocksSVG,
  'sock': SocksSVG,
  'sneakers': SneakerSVG,
  'sneaker': SneakerSVG,
  'trainers': SneakerSVG,
  'shoes': ShoeSVG,
  'shoe': ShoeSVG,
  'sweater': SweaterSVG,
  'jumper': SweaterSVG,
  'jacket': JacketSVG,
  'coat': CoatSVG,
  'boots': BootSVG,
  'boot': BootSVG,
  'hat': HatSVG,
  'cap': HatSVG,
  'scarf': ScarfSVG,
  'gloves': GlovesSVG,
  'glove': GlovesSVG,
  'uniform': UniformSVG,
  'pajamas': PajamasSVG,
  'swimsuit': SwimsuitSVG,
  'belt': BeltSVG,
  'glasses': GlassesSVG,
};
