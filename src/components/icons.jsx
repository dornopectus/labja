const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function IconDesktop(props) {
  return (
    <svg viewBox="0 0 24 24" width={props.size ?? 20} height={props.size ?? 20} {...stroke}>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M9 20h6M12 16v4" />
    </svg>
  )
}

export function IconNotebook(props) {
  return (
    <svg viewBox="0 0 24 24" width={props.size ?? 20} height={props.size ?? 20} {...stroke}>
      <rect x="4" y="5" width="16" height="10" rx="1.2" />
      <path d="M2 19h20l-1.5-3h-17z" />
    </svg>
  )
}

export function IconChromebook(props) {
  return (
    <svg viewBox="0 0 24 24" width={props.size ?? 20} height={props.size ?? 20} {...stroke}>
      <rect x="4" y="5" width="16" height="10" rx="1.2" />
      <circle cx="12" cy="10" r="2" />
      <path d="M2 19h20l-1.5-3h-17z" />
    </svg>
  )
}

export function IconTablet(props) {
  return (
    <svg viewBox="0 0 24 24" width={props.size ?? 20} height={props.size ?? 20} {...stroke}>
      <rect x="6" y="3" width="12" height="18" rx="1.8" />
      <path d="M11 18h2" />
    </svg>
  )
}

export function iconePorEquipamento(tipo) {
  switch (tipo) {
    case 'notebook':
      return IconNotebook
    case 'chromebook':
      return IconChromebook
    case 'tablet':
      return IconTablet
    default:
      return IconDesktop
  }
}

export function IconGrid(props) {
  return (
    <svg viewBox="0 0 24 24" width={props.size ?? 20} height={props.size ?? 20} {...stroke}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  )
}

export function IconCalendar(props) {
  return (
    <svg viewBox="0 0 24 24" width={props.size ?? 20} height={props.size ?? 20} {...stroke}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  )
}

export function IconBuilding(props) {
  return (
    <svg viewBox="0 0 24 24" width={props.size ?? 20} height={props.size ?? 20} {...stroke}>
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="M8 8h1M15 8h1M8 12h1M15 12h1M8 16h1M15 16h1" />
    </svg>
  )
}

export function IconLogout(props) {
  return (
    <svg viewBox="0 0 24 24" width={props.size ?? 20} height={props.size ?? 20} {...stroke}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  )
}
