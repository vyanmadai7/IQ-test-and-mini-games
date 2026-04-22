import React from 'react';

interface ShapeProps {
  shape: string;
  color: string;
  fill: string; // 'solid', 'outline', 'dotted'
  size?: number;
}

export function Shape({ shape, color, fill, size = 48 }: ShapeProps) {
  const strokeWidth = 2;
  const isOutline = fill === 'outline' || fill === 'dotted';
  const strokeDasharray = fill === 'dotted' ? '4,4' : 'none';
  const fillColor = isOutline ? 'transparent' : color;
  const strokeColor = color;

  const getPath = () => {
    switch (shape) {
      case 'circle':
        return <circle cx="50" cy="50" r="40" />;
      case 'square':
        return <rect x="10" y="10" width="80" height="80" rx="4" />;
      case 'triangle':
        return <polygon points="50,10 90,90 10,90" />;
      case 'diamond':
        return <polygon points="50,10 90,50 50,90 10,50" />;
      case 'hexagon':
        return <polygon points="25,10 75,10 100,50 75,90 25,90 0,50" />;
      default:
        return <circle cx="50" cy="50" r="40" />;
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill={fillColor}
      stroke={strokeColor}
      strokeWidth={isOutline ? strokeWidth * 2 : 0}
      strokeDasharray={strokeDasharray}
      style={{ overflow: 'visible' }}
    >
      {getPath()}
    </svg>
  );
}
