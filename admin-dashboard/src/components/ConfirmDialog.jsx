import React from 'react';
import Modal from './Modal';

/**
 * ConfirmDialog
 * Props:
 *   open         (bool)
 *   onClose      (func)
 *   onConfirm    (func)
 *   title        (string)
 *   message      (string | ReactNode)
 *   confirmText  (string)  default 'Confirm'
 *   confirmColor (string)  default 'var(--error)'
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title       = 'Are you sure?',
  message     = 'This action cannot be undone.',
  confirmText = 'Confirm',
  confirmColor = 'var(--error)',
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p style={{ color: 'var(--text)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 24 }}>
        {message}
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn"
          style={{ background: confirmColor, color: '#fff', borderColor: confirmColor }}
          onClick={() => { onConfirm(); onClose(); }}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
