
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface DraggableProps {
  id: string;
  children: React.ReactNode;
}

export function Draggable(props: Readonly<DraggableProps>) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: props.id,
  });
  const style: React.CSSProperties = {
    // Outputs `translate3d(x, y, 0)`
    borderRadius: '10px',
    width: '100%',
    minWidth: '70px',
    maxWidth: '100px',
    cursor: 'grab',
    backgroundColor: 'lightgreen',
    transform: CSS.Translate.toString(transform),
    touchAction: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none',
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      type="button"
    >
      {props.children}
    </button>
  );
}
