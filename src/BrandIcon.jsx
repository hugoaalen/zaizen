export default function BrandIcon({ className = '' }) {
  return (
    <img
      className={`brand-icon ${className}`.trim()}
      src="/icons/ZaiZen_app_icon.png"
      alt=""
      aria-hidden="true"
    />
  )
}
