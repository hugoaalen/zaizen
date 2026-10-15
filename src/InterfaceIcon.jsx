const paths = {
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM10 14h4v4h-4Z',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  close: 'm6 6 12 12M18 6 6 18',
  chevron: 'm8 10 4 4 4-4',
  repeat: 'm17 2 4 4-4 4M3 11V8a2 2 0 0 1 2-2h16M7 22l-4-4 4-4M21 13v3a2 2 0 0 1-2 2H3',
  edit: 'm16 3 5 5-12 12-6 1 1-6ZM14 5l5 5',
  delete: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7',
  pause: 'M9 5v14M15 5v14',
  play: 'm8 5 11 7-11 7Z',
  income: 'M18 6 6 18M6 6v12h12',
  expense: 'M6 18 18 6M6 6h12v12',
  copy: 'M8 8h12v12H8ZM16 8V4H4v12h4'
}

export default function InterfaceIcon({ name, ...props }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>
      <path d={paths[name] || paths.chevron} />
    </svg>
  )
}
