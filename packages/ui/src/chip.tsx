import type { HTMLAttributes, ReactNode } from 'react';
import { IsometricGlyph } from './isometric-glyph';

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

export function Chip({ children, className = '', ...props }: ChipProps) {
  return (
    <span {...props} className={`takaran-chip ${className}`.trim()}>
      <IsometricGlyph />
      <span>{children}</span>
    </span>
  );
}
