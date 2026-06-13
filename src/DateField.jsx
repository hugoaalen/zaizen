import { useId } from 'react'

export default function DateField({
  label,
  name,
  value,
  onChange,
  min,
  required = false
}) {
  const id = useId()

  return (
    <div className="date-field">
      <label htmlFor={id}>{label}</label>
      <span className={`date-field-control ${value ? 'has-value' : 'is-empty'}`}>
        <input
          id={id}
          className="input-minimal"
          name={name}
          type="date"
          min={min}
          value={value}
          onChange={event => onChange(event.target.value)}
          required={required}
        />
        {value && (
          <button
            className="date-field-clear"
            type="button"
            onClick={event => {
              event.preventDefault()
              onChange('')
            }}
            aria-label={`Quitar ${label.toLowerCase()}`}
          >
            Quitar
          </button>
        )}
      </span>
    </div>
  )
}
