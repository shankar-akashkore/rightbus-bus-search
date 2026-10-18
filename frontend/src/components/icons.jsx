function Icon({ children, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export function BusIcon(props) {
  return (
    <Icon {...props}>
      <rect x="4" y="3" width="16" height="14" rx="3" />
      <path d="M4 11h16M8 17v3M16 17v3" />
      <circle cx="8" cy="14" r="0.6" fill="currentColor" />
      <circle cx="16" cy="14" r="0.6" fill="currentColor" />
    </Icon>
  )
}

export function SwapIcon(props) {
  return (
    <Icon {...props}>
      <path d="M7 7h12l-3-3M17 17H5l3 3" />
    </Icon>
  )
}

export function AlertIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5M12 16.2v.3" />
    </Icon>
  )
}

export function CloseIcon(props) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  )
}
