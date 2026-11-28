'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragGrip from '@/components/DragGrip';

/** A product card that can be dragged to a new place in the list by its handle */
export default function SortableCard({
  id,
  position,
  sortable,
  children,
}: {
  id: string;
  position: number;
  sortable: boolean;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : undefined }}
      className={`relative border rounded-lg p-4 bg-gray-700 transition-shadow ${
        isDragging ? 'border-gold shadow-2xl opacity-90' : 'border-gray-700 hover:shadow-lg'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-400">#{position} in the shop</span>
        {sortable && (
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`Drag to change the order of this product (now number ${position})`}
            className={`touch-none flex items-center gap-1.5 px-2 py-1 rounded text-xs text-gray-300 hover:text-gold hover:bg-gray-600 ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            <DragGrip />
            Drag
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
