import React from 'react';

export function LetsIconsTrash(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      {...props}
    >
      <g fill="none">
        <circle
          cx={12}
          cy={12}
          r={9}
          fill="currentColor"
          fillOpacity={0.25}
        ></circle>
        <path
          stroke="currentColor"
          strokeWidth={1.2}
          d="m9 15l6-6m0 6L9 9"
        ></path>
      </g>
    </svg>
  );
}
