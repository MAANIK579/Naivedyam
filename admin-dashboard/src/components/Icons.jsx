// src/components/Icons.jsx — Clean SVG icon set for Navedyam Admin
import React from 'react';

const defaultProps = { size: 18, color: 'currentColor', strokeWidth: 1.8 };

function Icon({ size, color, strokeWidth, children, viewBox = '0 0 24 24' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0, display: 'inline-block' }}
    >
      {children}
    </svg>
  );
}

export function DashboardIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </Icon>
  );
}

export function OrdersIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </Icon>
  );
}

export function MenuIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </Icon>
  );
}

export function CouponIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </Icon>
  );
}

export function UsersIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Icon>
  );
}

export function AnalyticsIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </Icon>
  );
}

export function LogoutIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </Icon>
  );
}

export function FlameIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </Icon>
  );
}

export function TrendUpIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </Icon>
  );
}

export function TrendDownIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </Icon>
  );
}

export function CloseIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </Icon>
  );
}

export function SearchIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Icon>
  );
}

export function RefreshIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </Icon>
  );
}

export function PlusIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </Icon>
  );
}

export function EditIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </Icon>
  );
}

export function TrashIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </Icon>
  );
}

export function CheckIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <polyline points="20 6 9 17 4 12" />
    </Icon>
  );
}

export function AlertIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <triangle points="10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </Icon>
  );
}

export function ShoppingBagIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </Icon>
  );
}

export function CurrencyIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </Icon>
  );
}

export function ZapIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </Icon>
  );
}

export function UserIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Icon>
  );
}

export function PhoneIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.35 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.9a16 16 0 0 0 6.08 6.08l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </Icon>
  );
}

export function LockIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Icon>
  );
}

export function EyeIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  );
}

export function EyeOffIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </Icon>
  );
}

export function LocationIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </Icon>
  );
}

export function ClockIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </Icon>
  );
}

export function StarIcon({ size = 16, color = 'currentColor', filled = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0, display: 'inline-block' }}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function CalendarIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </Icon>
  );
}

export function FilterIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </Icon>
  );
}

export function ChevronRightIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <polyline points="9 18 15 12 9 6" />
    </Icon>
  );
}

export function ChevronDownIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <polyline points="6 9 12 15 18 9" />
    </Icon>
  );
}

export function CheckCircleIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </Icon>
  );
}

export function XCircleIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </Icon>
  );
}

export function BikeIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="18.5" cy="17.5" r="3.5" />
      <path d="M15 6a1 1 0 0 0 0-2h-3l-3 9H15" />
      <path d="M19.22 8H16L14 17" />
    </Icon>
  );
}

export function SpinnerIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0, display: 'inline-block', animation: 'spin 0.8s linear infinite' }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

export function CashIcon(p) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <Icon size={size} color={color} strokeWidth={strokeWidth}>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M6 12h.01M18 12h.01" />
    </Icon>
  );
}
