'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragGrip from '@/components/DragGrip';

/**
 * A table row that can be dragged to a new place by the handle in its first cell.
 * Put an empty <th> at the start of the table header to line up with that cell.
 */
export default function SortableRow({
  id,
  position,
  sortable = true,
  children,
}: {
  id: string;
  /** Its place in the list, starting at 1 */
  position: number;
  sortable?: boolean;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, position: 'relative', zIndex: isDragging ? 10 : undefined }}
      className={isDragging ? 'bg-gray-700 shadow-2xl opacity-90' : 'hover:bg-gray-750'}
    >
      <td className="pl-3 pr-1 py-3 w-24 whitespace-nowrap">
        {sortable ? (
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`Drag to change the order (now number ${position})`}
            className={`touch-none inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs text-gray-300 hover:text-gold hover:bg-gray-600 ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            <DragGrip />
            {position}
          </button>
        ) : (
          <span className="px-2 text-xs text-gray-400">{position}</span>
        )}
      </td>
      {children}
    </tr>
  );
}
