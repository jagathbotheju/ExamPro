'use client';

import { CSSProperties } from 'react';

interface IconProps {
  name: string;
  style?: CSSProperties;
  className?: string;
  solid?: boolean;
}

export default function Icon({ name, style, className = '', solid = true }: IconProps) {
  return (
    <i
      className={`${solid ? 'fa-solid' : 'fa-regular'} ${name} ${className}`}
      style={style}
    />
  );
}
