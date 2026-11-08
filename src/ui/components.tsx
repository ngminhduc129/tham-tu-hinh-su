import {
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'
import { STAGES } from '../domain/types'
import type { AnswerOption } from '../domain/types'
import { useGame } from './GameContext'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

export function Button({
  variant = 'secondary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={`button button--${variant} ${className}`.trim()} {...props} />
}

type Tone = 'neutral' | 'accent' | 'warn' | 'danger' | 'success'

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}

export function Card({
  children,
  className = '',
  as: Tag = 'section',
}: {
  children: ReactNode
  className?: string
  as?: 'section' | 'article' | 'div'
}) {
  return <Tag className={`card ${className}`.trim()}>{children}</Tag>
}

export function Callout({
  tone = 'info',
  title,
  children,
  className = '',
}: {
  tone?: 'info' | 'warn' | 'danger' | 'success'
  title?: string
  children: ReactNode
  className?: string
}) {
  const icon = tone === 'danger' ? '!' : tone === 'warn' ? '!' : tone === 'success' ? '✓' : 'i'
  return (
    <div className={`callout callout--${tone} ${className}`.trim()} role={tone === 'danger' ? 'alert' : undefined}>
      <span className="callout__icon" aria-hidden="true">
        {icon}
      </span>
      <div>
        {title && <p className="callout__title">{title}</p>}
        <div className="callout__body">{children}</div>
      </div>
    </div>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="section-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        {description && <div className="section-heading__description">{description}</div>}
      </div>
      {actions && <div className="section-heading__actions">{actions}</div>}
    </header>
  )
}

export function ProgressBar({
  value,
  total,
  label,
}: {
  value: number
  total: number
  label: string
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="progress">
      <div className="progress__meta">
        <span>{label}</span>
        <span>
          {value}/{total}
        </span>
      </div>
      <div
        className="progress__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={value}
        aria-label={label}
      >
        <span className="progress__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

export function Stepper() {
  const { session, navigate } = useGame()
  return (
    <nav className="stepper" aria-label="Các giai đoạn của phiên học">
      <ol>
        {STAGES.map((stage, index) => {
          const active = session.currentStage === stage.id
          const disabled = stage.id === 'feedback' && session.status !== 'submitted'
          return (
            <li key={stage.id}>
              <button
                type="button"
                className={`stepper__item ${active ? 'stepper__item--active' : ''}`}
                aria-current={active ? 'step' : undefined}
                disabled={disabled}
                onClick={() => navigate(`case/${session.caseId}/${stage.route}`)}
              >
                <span className="stepper__index" aria-hidden="true">
                  {index + 1}
                </span>
                <span className="stepper__label">{stage.shortLabel}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export function SingleChoice({
  name,
  legend,
  hint,
  options,
  value,
  onChange,
  allowClear = false,
  readOnly = false,
  compact = false,
}: {
  name: string
  legend: string
  hint?: string
  options: AnswerOption[]
  value: string | null
  onChange: (value: string | null) => void
  allowClear?: boolean
  readOnly?: boolean
  compact?: boolean
}) {
  const id = useId()
  return (
    <fieldset className={`field ${compact ? 'field--compact' : ''}`}>
      <legend className="field__legend">{legend}</legend>
      {hint && (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      <div className="choice-list" aria-describedby={hint ? `${id}-hint` : undefined}>
        {options.map((option) => (
          <label
            key={option.id}
            className={`choice ${value === option.id ? 'choice--checked' : ''} ${
              readOnly ? 'choice--readonly' : ''
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
              disabled={readOnly}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {allowClear && value !== null && !readOnly && (
        <button type="button" className="link-button" onClick={() => onChange(null)}>
          Bỏ chọn câu trả lời này
        </button>
      )}
    </fieldset>
  )
}

export function MultiChoice({
  legend,
  hint,
  options,
  values,
  onToggle,
  readOnly = false,
  compact = false,
}: {
  legend: string
  hint?: string
  options: AnswerOption[]
  values: string[]
  onToggle: (value: string) => void
  readOnly?: boolean
  compact?: boolean
}) {
  const id = useId()
  return (
    <fieldset className={`field ${compact ? 'field--compact' : ''}`}>
      <legend className="field__legend">{legend}</legend>
      {hint && (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      <div className="choice-list" aria-describedby={hint ? `${id}-hint` : undefined}>
        {options.map((option) => (
          <label
            key={option.id}
            className={`choice ${values.includes(option.id) ? 'choice--checked' : ''} ${
              readOnly ? 'choice--readonly' : ''
            }`}
          >
            <input
              type="checkbox"
              value={option.id}
              checked={values.includes(option.id)}
              onChange={() => onToggle(option.id)}
              disabled={readOnly}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function NoteField({
  label,
  hint,
  value,
  onChange,
  readOnly = false,
  rows = 3,
  placeholder,
}: {
  label: string
  hint?: string
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  rows?: number
  placeholder?: string
}) {
  const id = useId()
  return (
    <div className="field">
      <label className="field__legend" htmlFor={id}>
        {label}
      </label>
      {hint && (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      <textarea
        id={id}
        className="textarea"
        rows={rows}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal__head">
          <h2 id={titleId}>{title}</h2>
          <button
            type="button"
            className="modal__close"
            aria-label="Đóng hộp thoại"
            onClick={onClose}
            ref={closeRef}
          >
            ×
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__foot">{footer}</div>}
      </div>
    </div>
  )
}

const HINT_LEVEL_LABELS: Record<number, string> = {
  1: 'Cấp 1 — hướng sự chú ý',
  2: 'Cấp 2 — nhắc nguyên tắc',
  3: 'Cấp 3 — thu hẹp lựa chọn',
}

export function HintPanel() {
  const { caseFile, session, dispatch, readOnly } = useGame()
  const hints = (caseFile.hints ?? [])
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const revealed = hints.filter((hint) => session.selectedHints.includes(hint.id))
  const next = hints.find((hint) => !session.selectedHints.includes(hint.id))

  if (hints.length === 0) return null

  return (
    <details className="hint-panel">
      <summary>
        Gợi ý ({revealed.length}/{hints.length})
      </summary>
      <p className="hint-panel__note">
        Gợi ý không bị trừ điểm. Hệ thống chỉ ghi nhận để nghiên cứu trải nghiệm.
      </p>
      <ul className="hint-panel__list">
        {revealed.map((hint) => (
          <li key={hint.id}>
            <span className="hint-panel__level">{HINT_LEVEL_LABELS[hint.level]}</span>
            <p>{hint.text}</p>
          </li>
        ))}
      </ul>
      {next && !readOnly && (
        <Button variant="ghost" onClick={() => dispatch({ type: 'USE_HINT', hintId: next.id })}>
          Mở gợi ý tiếp theo
        </Button>
      )}
      {!next && <p className="hint-panel__done">Bạn đã mở toàn bộ gợi ý của hồ sơ.</p>}
    </details>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty-state">
      <p className="empty-state__title">{title}</p>
      {children && <div>{children}</div>}
    </div>
  )
}
