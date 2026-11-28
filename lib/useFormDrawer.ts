import { useCallback, useRef, useState } from 'react';

/**
 * State for an admin "add / edit" panel that opens over a list.
 * Keeps track of what is being edited and whether the form has unsaved changes,
 * so closing the panel can ask before throwing them away.
 */
export function useFormDrawer<T extends object>(emptyForm: T) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<T>(emptyForm);
  const emptyRef = useRef(emptyForm);
  // What the form looked like when the panel opened, to tell whether anything was changed
  const startedAs = useRef(JSON.stringify(emptyForm));

  const begin = useCallback((id: string | null, data: T) => {
    setEditingId(id);
    setFormData(data);
    startedAs.current = JSON.stringify(data);
    setOpen(true);
  }, []);

  /** Opens an empty form to add something new. `prefill` fills in some fields up front. */
  const openNew = useCallback((prefill?: Partial<T>) => begin(null, { ...emptyRef.current, ...prefill }), [begin]);

  /** Opens the form with an existing item's values */
  const openEdit = useCallback((id: string, data: T) => begin(id, data), [begin]);

  /** Closes the panel and clears the form, without asking */
  const close = useCallback(() => {
    setOpen(false);
    setEditingId(null);
    setFormData(emptyRef.current);
  }, []);

  const isDirty = open && JSON.stringify(formData) !== startedAs.current;

  /** Closes the panel, but first asks if there are unsaved changes. Returns whether it closed. */
  const requestClose = useCallback(() => {
    if (isDirty && !window.confirm('Discard your unsaved changes?')) return false;
    close();
    return true;
  }, [isDirty, close]);

  return { open, editingId, formData, setFormData, openNew, openEdit, close, requestClose, isDirty };
}
