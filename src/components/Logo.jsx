// Капля воды (Каспий) с волной и эко-листом внутри — знак платформы Kepil.
export default function Logo({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="kepil-logo-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#0a4a5c" />
        </linearGradient>
      </defs>
      <path
        fill="url(#kepil-logo-grad)"
        d="M50 6 C72 34 86 52 86 68 C86 86 70 98 50 98 C30 98 14 86 14 68 C14 52 28 34 50 6 Z"
      />
      <path
        d="M50 20 C58 26 60 36 50 44 C40 36 42 26 50 20 Z"
        fill="#16a34a"
      />
      <path
        d="M22 63 Q31 55 40 63 T58 63 T76 63"
        stroke="white"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M22 75 Q31 67 40 75 T58 75 T76 75"
        stroke="white"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  )
}
