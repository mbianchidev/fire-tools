interface FireIconProps {
  size?: number;
  className?: string;
}

export function FireIcon({ size = 24, className = '' }: FireIconProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="fireGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#f093fb', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#f5576c', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <path d="M 50 10 Q 35 30 35 45 Q 35 60 50 70 Q 65 60 65 45 Q 65 30 50 10 Z" fill="url(#fireGradient)"/>
      <path d="M 50 30 Q 42 40 42 50 Q 42 60 50 65 Q 58 60 58 50 Q 58 40 50 30 Z" fill="#FFA726"/>
      <path d="M 50 45 Q 46 50 46 55 Q 46 60 50 62 Q 54 60 54 55 Q 54 50 50 45 Z" fill="#FFEB3B"/>
    </svg>
  );
}
