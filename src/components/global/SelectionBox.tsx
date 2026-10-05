import React from 'react';

interface SelectionBoxProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

/**
 * Selection Box — thin rectangle with 8 handles, like Illustrator selection.
 * Handles: 4 corners + 4 midpoints.
 */
export default function SelectionBox({ children, color = 'var(--signal)', className = '' }: SelectionBoxProps) {
  const handleStyle = (pos: Record<string, string>): React.CSSProperties => ({
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: color,
    border: `1px solid var(--bone)`,
    ...pos,
  });

  return (
    <div
      className={`selection-box ${className}`}
      style={{
        position: 'relative',
        border: `2px solid ${color}`,
        display: 'inline-block',
      }}
    >
      {children}

      {/* Corner handles */}
      <div className="sel-handle" style={handleStyle({ top: '-5px', left: '-5px' })} />
      <div className="sel-handle" style={handleStyle({ top: '-5px', right: '-5px' })} />
      <div className="sel-handle" style={handleStyle({ bottom: '-5px', left: '-5px' })} />
      <div className="sel-handle" style={handleStyle({ bottom: '-5px', right: '-5px' })} />

      {/* Midpoint handles */}
      <div className="sel-handle" style={handleStyle({ top: '-5px', left: '50%', transform: 'translateX(-50%)' })} />
      <div className="sel-handle" style={handleStyle({ bottom: '-5px', left: '50%', transform: 'translateX(-50%)' })} />
      <div className="sel-handle" style={handleStyle({ top: '50%', left: '-5px', transform: 'translateY(-50%)' })} />
      <div className="sel-handle" style={handleStyle({ top: '50%', right: '-5px', transform: 'translateY(-50%)' })} />
    </div>
  );
}
