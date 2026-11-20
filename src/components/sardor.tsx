import { cn } from '@/lib/utils'

export type SardorMood = 'confused' | 'listening' | 'thinking' | 'happy' | 'worried'

type SardorProps = {
  mood?: SardorMood
  /** 0–1 microphone level: the listening arcs grow with the student's voice. */
  level?: number
  /** Accessible name; without it Sardor is decorative (aria-hidden). */
  label?: string
  className?: string
}

const INK = 'var(--ink)'
const SKIN = '#f3c9a1'
const HAIR = '#2e2018'

/** Brows, eyes and mouth per mood; the head, cap and uniform never change. */
function Face({ mood }: { mood: SardorMood }) {
  switch (mood) {
    case 'listening':
      return (
        <>
          <path
            d="M56 64 q8 -5 16 -1 M88 63 q8 -4 16 1"
            stroke={INK}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <g className="sardor-eyes">
            <circle cx="64" cy="78" r="6" fill={INK} />
            <circle cx="96" cy="78" r="6" fill={INK} />
            <circle cx="66" cy="76" r="1.8" fill="#fff" />
            <circle cx="98" cy="76" r="1.8" fill="#fff" />
          </g>
          <ellipse cx="80" cy="102" rx="5" ry="6" fill={INK} />
        </>
      )
    case 'thinking':
      return (
        <>
          <path
            d="M56 66 q8 -3 16 0 M88 60 q8 -5 16 0"
            stroke={INK}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <g className="sardor-eyes">
            <circle cx="62" cy="75" r="4.5" fill={INK} />
            <circle cx="94" cy="75" r="4.5" fill={INK} />
          </g>
          <path d="M72 103 h16" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
        </>
      )
    case 'happy':
      return (
        <>
          <path
            d="M56 62 q8 -6 16 -2 M88 60 q8 -4 16 2"
            stroke={INK}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M57 79 q7 -9 14 0 M89 79 q7 -9 14 0"
            stroke={INK}
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M66 96 q14 16 28 0 z" fill={INK} />
          <path d="M71 101 q9 6 18 0" fill="#e86b5f" />
        </>
      )
    case 'worried':
      return (
        <>
          <path
            d="M56 66 q8 -2 15 -7 M89 59 q7 5 15 7"
            stroke={INK}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <g className="sardor-eyes">
            <circle cx="64" cy="79" r="4.5" fill={INK} />
            <circle cx="96" cy="79" r="4.5" fill={INK} />
          </g>
          <path
            d="M68 107 q12 -10 24 0"
            stroke={INK}
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )
    case 'confused':
    default:
      return (
        <>
          <path
            d="M56 66 h15 M88 58 q8 -4 16 2"
            stroke={INK}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <g className="sardor-eyes">
            <circle cx="64" cy="78" r="4.5" fill={INK} />
            <circle cx="96" cy="77" r="5" fill={INK} />
          </g>
          <path
            d="M68 103 q4 -5 8 0 t8 0 t8 0"
            stroke={INK}
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )
  }
}

/** Small extras that say the mood without words. */
function Extras({ mood, level }: { mood: SardorMood; level: number }) {
  switch (mood) {
    case 'listening': {
      const grow = 0.85 + Math.min(1, Math.max(0, level)) * 0.5
      return (
        <g
          className="sardor-arcs"
          style={{
            transform: `scale(${grow})`,
            transformOrigin: '126px 84px',
            transformBox: 'view-box',
          }}
          stroke="var(--primary)"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        >
          <path d="M128 72 q8 12 0 24" />
          <path d="M137 65 q13 19 0 38" />
        </g>
      )
    }
    case 'thinking':
      return (
        <g className="sardor-dots" fill="var(--sardor)" stroke={INK} strokeWidth="2">
          <circle cx="128" cy="44" r="4" />
          <circle cx="138" cy="32" r="5.5" />
          <circle cx="150" cy="17" r="7" />
        </g>
      )
    case 'happy':
      return (
        <g
          className="sardor-sparkles"
          fill="var(--sardor)"
          stroke={INK}
          strokeWidth="1.5"
          strokeLinejoin="round"
        >
          <path d="M22 44 l3 -9 l3 9 l9 3 l-9 3 l-3 9 l-3 -9 l-9 -3 z" />
          <path d="M136 30 l2 -6 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 z" />
        </g>
      )
    case 'worried':
      return (
        <path d="M120 58 q6 9 0 13 q-6 -4 0 -13 z" fill="#8fd0f0" stroke={INK} strokeWidth="2" />
      )
    case 'confused':
    default:
      return (
        <text
          x="128"
          y="40"
          fontFamily="var(--font-display)"
          fontWeight="700"
          fontSize="26"
          fill="var(--sardor)"
          stroke={INK}
          strokeWidth="1.5"
          paintOrder="stroke"
        >
          ?
        </text>
      )
  }
}

/**
 * Sardor, the AI classmate who misunderstood the topic. One drawing; the mood swaps his
 * eyes, mouth and a small extra. He blinks and bobs gently; everything rests under reduced motion.
 */
export function Sardor({ mood = 'confused', level = 0, label, className }: SardorProps) {
  return (
    <svg
      viewBox="0 0 160 160"
      className={cn('sardor size-24 shrink-0 overflow-visible', `sardor-${mood}`, className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <g className="sardor-body">
        {/* Uniform with a white collar */}
        <path
          d="M30 160 q4 -30 34 -36 h32 q30 6 34 36 z"
          fill="var(--primary)"
          stroke={INK}
          strokeWidth="3"
        />
        <path
          d="M64 124 l16 14 l16 -14 l-6 -4 l-10 9 l-10 -9 z"
          fill="#fff"
          stroke={INK}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Ears and head */}
        <circle cx="40" cy="84" r="9" fill={SKIN} stroke={INK} strokeWidth="3" />
        <circle cx="120" cy="84" r="9" fill={SKIN} stroke={INK} strokeWidth="3" />
        <ellipse cx="80" cy="80" rx="39" ry="41" fill={SKIN} stroke={INK} strokeWidth="3" />
        {/* Hair, with the curl that makes a question mark */}
        <path
          d="M43 70 q2 -26 37 -30 q35 4 37 30 q-8 -12 -18 -14 q-20 6 -38 0 q-12 4 -18 14 z"
          fill={HAIR}
        />
        <path
          d="M103 44 q14 -12 6 -22 q-7 -7 -14 0"
          stroke={HAIR}
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Doppi: the Uzbek skullcap, black with white pepper motifs */}
        <path
          d="M50 50 q2 -16 30 -18 q28 2 30 18 q-30 -8 -60 0 z"
          fill="#1c1c24"
          stroke={INK}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <g fill="#fff">
          <path d="M64 42 q3 -5 6 -1 q-1 4 -6 1 z" />
          <path d="M77 39 q3 -5 6 -1 q-1 4 -6 1 z" />
          <path d="M90 42 q3 -5 6 -1 q-1 4 -6 1 z" />
        </g>
        {/* Cheeks */}
        <circle cx="54" cy="92" r="6" fill="#ef8f7c" opacity={mood === 'happy' ? 0.55 : 0.28} />
        <circle cx="106" cy="92" r="6" fill="#ef8f7c" opacity={mood === 'happy' ? 0.55 : 0.28} />
        <Face mood={mood} />
      </g>
      <Extras mood={mood} level={level} />
    </svg>
  )
}
