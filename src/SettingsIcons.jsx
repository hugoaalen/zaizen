const iconProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true
}

export function CategoriesIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20.6 13.6 13.7 20.5a2 2 0 0 1-2.8 0L3.5 13.1A2 2 0 0 1 3 11.7V5a2 2 0 0 1 2-2h6.7a2 2 0 0 1 1.4.6l7.5 7.2a2 2 0 0 1 0 2.8Z" />
      <circle cx="8" cy="8" r="1.35" />
    </svg>
  )
}

export function RecurringIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20 11a8 8 0 0 0-14.9-4M4 4v4h4" />
      <path d="M4 13a8 8 0 0 0 14.9 4M20 20v-4h-4" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

export function ImportIcon() {
  return (
    <svg {...iconProps}>
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v5h5M12 11v7M9 15l3 3 3-3" />
    </svg>
  )
}

export function AppearanceIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 3a9 9 0 1 0 0 18h1.3a1.7 1.7 0 0 0 1.2-2.9 1.7 1.7 0 0 1 1.2-2.9H17a4 4 0 0 0 4-4C21 6.7 17 3 12 3Z" />
      <circle cx="7.5" cy="10" r=".8" fill="currentColor" stroke="none" />
      <circle cx="10" cy="6.8" r=".8" fill="currentColor" stroke="none" />
      <circle cx="14" cy="6.8" r=".8" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="10" r=".8" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function PrivacyIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 3 5 6v5c0 4.7 2.8 8.2 7 10 4.2-1.8 7-5.3 7-10V6l-7-3Z" />
      <rect x="9" y="10.5" width="6" height="5" rx="1" />
      <path d="M10.5 10.5V9a1.5 1.5 0 0 1 3 0v1.5" />
    </svg>
  )
}
