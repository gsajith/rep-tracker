import React from 'react';

// Authored for the tour's swipe step, matching the Lets Icons set it sits
// beside: 24x24 box, no fill, 2px currentColor stroke, round caps.
export function LetsIconsSwipe(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      {...props}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x={2} y={6} width={20} height={12} rx={3}></rect>
        <path d="M9.5 9.5L7.5 12l2 2.5"></path>
        <path d="M12 9.5v5"></path>
        <path d="M14.5 9.5l2 2.5-2 2.5"></path>
      </g>
    </svg>
  );
}
