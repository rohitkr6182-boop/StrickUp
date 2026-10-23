import { useEffect } from 'react';
import { X } from 'lucide-react';

export function Button({ children, variant = 'primary', className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={`button button-${variant} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = '' }) {
  return <section className={`card ${className}`}>{children}</section>;
}

export function Field({ label, className = '', ...props }) {
  return (
    <label className={`field-wrap ${className}`}>
      <span>{label}</span>
      <input className="field" {...props} />
    </label>
  );
}

export function SelectField({ label, children, className = '', ...props }) {
  return (
    <label className={`field-wrap ${className}`}>
      <span>{label}</span>
      <select className="field" {...props}>{children}</select>
    </label>
  );
}

export function TextAreaField({ label, className = '', ...props }) {
  return (
    <label className={`field-wrap ${className}`}>
      <span>{label}</span>
      <textarea className="field textarea" {...props} />
    </label>
  );
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-heading">
          <h2 id="modal-title">{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={19} /></button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, detail, action }) {
  return (
    <div className="empty-state">
      {Icon && <span className="empty-icon"><Icon size={22} /></span>}
      <h3>{title}</h3>
      <p>{detail}</p>
      {action}
    </div>
  );
}

export function Notice({ children, tone = 'info' }) {
  if (!children) return null;
  return <div className={`notice notice-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{children}</div>;
}
