
import { useDroppable } from '@dnd-kit/core';

interface DroppableProps {
  id: string;
  children: React.ReactNode;
  noOpacity?: boolean;
}

export function isDroppable(key: string): boolean {
  return key?.startsWith('droppable') || false;
}

export function Droppable(props: Readonly<DroppableProps>) {
  const { isOver, setNodeRef } = useDroppable({
    id: props.id,
  });
  const style = {
    backgroundColor: isOver ? 'lightblue' : 'white',
    opacity: props?.noOpacity || isOver ? 1 : 0.5,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {props.children}
    </div>
  );
}
