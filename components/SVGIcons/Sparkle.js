// The four-point sparkle from the app icon, with the same concave sides.
// Three of these sit above the rising line in public/icons/icon-512.png.
export function Sparkle({ size = 24, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...rest}
    >
      <path d="M12 0c1.1 8.2 3.8 10.9 12 12-8.2 1.1-10.9 3.8-12 12-1.1-8.2-3.8-10.9-12-12C8.2 10.9 10.9 8.2 12 0Z" />
    </svg>
  );
}
