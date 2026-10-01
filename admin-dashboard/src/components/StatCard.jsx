import React from 'react';
import { TrendUpIcon, TrendDownIcon } from './Icons';

/**
 * StatCard
 * Props:
 *   title      (string)
 *   value      (string | number)
 *   icon       (React element – SVG icon component)
 *   color      (hex string – accent colour)
 *   trend      (optional) { direction: 'up'|'down', value: string }
 */
export default function StatCard({ title, value, icon, color = '#16A34A', trend }) {
  const iconBg   = color + '18';
  const iconBorder = color + '25';

  return (
    <div
      className="card"
      style={{
        display:       'flex',
        flexDirection: 'column',
        gap:           14,
        padding:       '20px',
        position:      'relative',
        overflow:      'hidden',
        cursor:        'default',
      }}
    >
      {/* Decorative circle */}
      <div style={{
        position:     'absolute',
        top:          -24,
        right:        -24,
        width:        90,
        height:       90,
        borderRadius: '50%',
        background:   color + '10',
        pointerEvents:'none',
      }} />

      {/* Icon + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width:          42,
          height:         42,
          borderRadius:   12,
          background:     iconBg,
          border:         `1.5px solid ${iconBorder}`,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          flexShrink:     0,
          color:          color,
        }}>
          {icon}
        </div>
        <span style={{
          fontSize:       '0.72rem',
          fontWeight:     700,
          color:          'var(--text-muted)',
          textTransform:  'uppercase',
          letterSpacing:  '0.06em',
        }}>
          {title}
        </span>
      </div>

      {/* Value */}
      <div style={{
        fontSize:      '2rem',
        fontWeight:    800,
        color:         'var(--text)',
        lineHeight:    1.1,
        letterSpacing: '-0.03em',
      }}>
        {value ?? '—'}
      </div>

      {/* Trend */}
      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            display:      'inline-flex',
            alignItems:   'center',
            gap:          4,
            fontSize:     '0.75rem',
            fontWeight:   700,
            color:        trend.direction === 'up' ? 'var(--green)' : 'var(--error)',
            background:   trend.direction === 'up' ? 'var(--green-pale)'  : 'var(--error-pale)',
            border:       `1px solid ${trend.direction === 'up' ? 'var(--green-border)' : 'var(--error-border)'}`,
            padding:      '2px 8px',
            borderRadius: 'var(--radius-full)',
          }}>
            {trend.direction === 'up'
              ? <TrendUpIcon size={12} color="currentColor" strokeWidth={2.5} />
              : <TrendDownIcon size={12} color="currentColor" strokeWidth={2.5} />
            }
            {trend.value}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>vs yesterday</span>
        </div>
      )}
    </div>
  );
}
