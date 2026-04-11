/**
 * HippoMark — the brand mark SVG.
 *
 * Geometric hippo head, front-facing. Teal gradient with clean
 * proportions that read well from 16px favicon to 64px splash.
 */
export function HippoMark({ size = 32 }: { size?: number }) {
  const id = `hm-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${id}-g`} x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22D3EE" />
          <stop offset="1" stopColor="#0EA5E9" />
        </linearGradient>
      </defs>

      {/* Ears */}
      <ellipse cx="17" cy="12" rx="7" ry="10" fill={`url(#${id}-g)`} opacity="0.85" transform="rotate(-6 17 12)" />
      <ellipse cx="47" cy="12" rx="7" ry="10" fill={`url(#${id}-g)`} opacity="0.85" transform="rotate(6 47 12)" />
      {/* Inner ears */}
      <ellipse cx="17" cy="13" rx="4" ry="6" fill="#0B1120" opacity="0.25" transform="rotate(-6 17 13)" />
      <ellipse cx="47" cy="13" rx="4" ry="6" fill="#0B1120" opacity="0.25" transform="rotate(6 47 13)" />

      {/* Head */}
      <path
        d="M12 28C12 18 20 10 32 10C44 10 52 18 52 28V35C55 35 59 39 59 44C59 49 55 52 52 52V54C52 62 44 64 32 64C20 64 12 62 12 54V52C9 52 5 49 5 44C5 39 9 35 12 35Z"
        fill={`url(#${id}-g)`}
      />

      {/* Eyes */}
      <ellipse cx="24" cy="31" rx="4" ry="4.5" fill="#0B1120" />
      <ellipse cx="40" cy="31" rx="4" ry="4.5" fill="#0B1120" />
      {/* Eye highlights */}
      <circle cx="25.5" cy="29.5" r="1.8" fill="white" opacity="0.65" />
      <circle cx="41.5" cy="29.5" r="1.8" fill="white" opacity="0.65" />

      {/* Muzzle bump */}
      <ellipse cx="32" cy="46" rx="11" ry="7" fill={`url(#${id}-g)`} opacity="0.12" />

      {/* Nostrils */}
      <ellipse cx="27" cy="45" rx="2.8" ry="2.2" fill="#0B1120" opacity="0.3" />
      <ellipse cx="37" cy="45" rx="2.8" ry="2.2" fill="#0B1120" opacity="0.3" />
    </svg>
  );
}
