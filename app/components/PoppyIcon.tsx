export default function PoppyIcon({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top petal */}
      <ellipse cx="32" cy="18" rx="9" ry="16" fill="#E07850" opacity="0.92" />
      {/* Bottom petal */}
      <ellipse cx="32" cy="46" rx="9" ry="16" fill="#E07850" opacity="0.92" />
      {/* Left petal */}
      <ellipse cx="18" cy="32" rx="16" ry="9" fill="#C95E35" opacity="0.85" />
      {/* Right petal */}
      <ellipse cx="46" cy="32" rx="16" ry="9" fill="#C95E35" opacity="0.85" />
      {/* Top-left petal */}
      <ellipse
        cx="21"
        cy="21"
        rx="9"
        ry="15"
        fill="#D96840"
        opacity="0.75"
        transform="rotate(-45 21 21)"
      />
      {/* Top-right petal */}
      <ellipse
        cx="43"
        cy="21"
        rx="9"
        ry="15"
        fill="#D96840"
        opacity="0.75"
        transform="rotate(45 43 21)"
      />
      {/* Bottom-left petal */}
      <ellipse
        cx="21"
        cy="43"
        rx="9"
        ry="15"
        fill="#D96840"
        opacity="0.75"
        transform="rotate(45 21 43)"
      />
      {/* Bottom-right petal */}
      <ellipse
        cx="43"
        cy="43"
        rx="9"
        ry="15"
        fill="#D96840"
        opacity="0.75"
        transform="rotate(-45 43 43)"
      />
      {/* Center seed pod */}
      <circle cx="32" cy="32" r="9" fill="#2C1810" />
      {/* Center highlight dots */}
      <circle cx="29" cy="29" r="1.2" fill="#5C3820" />
      <circle cx="32" cy="28" r="1.2" fill="#5C3820" />
      <circle cx="35" cy="29" r="1.2" fill="#5C3820" />
      <circle cx="30" cy="32" r="1.2" fill="#5C3820" />
      <circle cx="34" cy="32" r="1.2" fill="#5C3820" />
      <circle cx="32" cy="35" r="1.2" fill="#5C3820" />
    </svg>
  );
}
