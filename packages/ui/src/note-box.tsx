import type { HTMLAttributes, ReactNode } from 'react';

export interface NoteBoxProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function NoteBox({ children, className = '', ...props }: NoteBoxProps) {
  return (
    <div {...props} className={`takaran-note-box ${className}`.trim()}>
      {children}
    </div>
  );
}
