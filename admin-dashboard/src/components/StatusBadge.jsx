import React from 'react';

const STATUS_MAP = {
  placed: {
    label: 'Placed',
    bg: '#DCFCE7', color: '#14532D', border: '#86EFAC',
    dot: '#22C55E',
  },
  confirmed: {
    label: 'Confirmed',
    bg: '#DCFCE7', color: '#166534', border: '#86EFAC',
    dot: '#22C55E',
  },
  preparing: {
    label: 'Preparing',
    bg: '#DCFCE7', color: '#166534', border: '#86EFAC',
    dot: '#16A34A',
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    bg: '#F0FDF4', color: '#15803D', border: '#86EFAC',
    dot: '#22C55E',
  },
  delivered: {
    label: 'Delivered',
    bg: '#DCFCE7', color: '#14532D', border: '#4ADE80',
    dot: '#16A34A',
  },
  cancelled: {
    label: 'Cancelled',
    bg: '#122519', color: '#9CC5A8', border: '#1F3328',
    dot: '#86EFAC',
  },
};

/**
 * StatusBadge
 * Props:
 *   status (string) – order status key
 */
export default function StatusBadge({ status }) {
  const cfg = STATUS_MAP[status] ?? {
    label:  status ?? 'Unknown',
    bg:     'var(--cream-dark)',
    color:  'var(--text-muted)',
    border: 'var(--border)',
    dot:    'var(--text-muted)',
  };

  return (
    <span
      className="badge"
      style={{
        background:    cfg.bg,
        color:         cfg.color,
        border:        `1px solid ${cfg.border}`,
        fontWeight:    600,
        fontSize:      '0.72rem',
        letterSpacing: '0.01em',
      }}
    >
      <span style={{
        width:        6,
        height:       6,
        borderRadius: '50%',
        background:   cfg.dot,
        flexShrink:   0,
        display:      'inline-block',
      }} />
      {cfg.label}
    </span>
  );
}
