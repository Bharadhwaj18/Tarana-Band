export type OrderStatus = '' | 'saving' | 'saved' | 'error';

/** Small status line shown while a new display order is being saved */
export default function OrderSaveStatus({ status }: { status: OrderStatus }) {
  return (
    <span role="status" className={`text-sm ${status === 'error' ? 'text-red-400' : status === 'saved' ? 'text-green-400' : 'text-gray-400'}`}>
      {status === 'saving' && 'Saving the new order…'}
      {status === 'saved' && 'New order saved'}
      {status === 'error' && "Couldn't save the new order, so it was put back"}
    </span>
  );
}
