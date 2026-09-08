export default function ChevronIcon({ direction = 'left' }) {
  const path = direction === 'right' ? 'M6 3.5 12.5 10 6 16.5' : 'M10 3.5 3.5 10 10 16.5'

  return (
    <svg className="stepper-chevron" viewBox="0 0 16 20" aria-hidden="true" focusable="false">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
