interface CoffeeCupLogoProps {
  className?: string;
}

export function CoffeeCupLogo({ className = 'w-8 h-8' }: CoffeeCupLogoProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Subtle circular editorial seal */}
      <rect width="40" height="40" rx="10" fill="#0F274A" />
      {/* Steam wisps */}
      <path
        d="M15.5 11.5C15.5 9.8 17 9.2 17 7.5"
        stroke="#F59E0B"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M20.5 11C20.5 9 22 8.4 22 6.5"
        stroke="#FBBF24"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      {/* Cup body */}
      <path
        d="M10.5 15.5H26.5V22.5C26.5 26.6421 23.1421 30 19 30H18C13.8579 30 10.5 26.6421 10.5 22.5V15.5Z"
        fill="#FAF8F4"
      />
      {/* Rich coffee rim */}
      <ellipse cx="18.5" cy="15.8" rx="7" ry="1.4" fill="#4A2511" />
      {/* Cup handle */}
      <path
        d="M26.5 17.5H28.4C30.1673 17.5 31.6 18.9327 31.6 20.7V21.3C31.6 23.0673 30.1673 24.5 28.4 24.5H26.5"
        stroke="#FAF8F4"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Saucer */}
      <path
        d="M8.5 32.2C11.8 33.4 25.2 33.4 28.5 32.2"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
