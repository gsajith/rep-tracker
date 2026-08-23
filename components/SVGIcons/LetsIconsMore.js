import React from 'react';

// Authored for the workout card's options control. Dots are filled rather than
// stroked, matching the set's solid glyphs, in the same 24x24 box.
export function LetsIconsMore(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      {...props}
    >
      <g fill="currentColor">
        <circle cx={5} cy={12} r={1.75}></circle>
        <circle cx={12} cy={12} r={1.75}></circle>
        <circle cx={19} cy={12} r={1.75}></circle>
      </g>
    </svg>
  );
}
