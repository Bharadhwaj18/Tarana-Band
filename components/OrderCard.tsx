import type { CustomerOrder } from '@/lib/customerOrders';
import { orderNumber } from '@/lib/emailTemplates';

// One order as the customer sees it: status, what's in it, where it's going, tracking and refund details.
// Rendered on the server, so nothing here ships to the browser except the finished page.

const INDIA_POST_TRACKING = 'https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx';

const rupees = (n: number | string) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

function day(iso: string | null | undefined) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

function Step({ done, label, date }: { done: boolean; label: string; date?: string }) {
  return (
    <li className={`flex-1 min-w-[120px] border-[3px] border-ink px-3 py-2 ${done ? 'bg-ink text-paper' : 'bg-white text-muted'}`}>
      <p className="gp-mono text-xs uppercase font-bold">{done ? '✓ ' : ''}{label}</p>
      <p className="gp-mono text-xs mt-0.5">{done ? date || '' : 'Not yet'}</p>
    </li>
  );
}

export default function OrderCard({ order }: { order: CustomerOrder }) {
  const cancelled = order.status === 'cancelled';
  const shipped = order.status === 'shipped';
  const place = [
    order.address_line1,
    order.address_line2,
    [order.city, order.state].filter(Boolean).join(', ') + (order.pincode ? ` – ${order.pincode}` : ''),
  ].filter(Boolean);
  const viaIndiaPost = !order.carrier || /india\s*post/i.test(order.carrier);

  return (
    <article className="border-[3px] border-ink bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="gp-mono text-sm font-bold">ORDER {orderNumber(order.id)}</p>
          <p className="gp-mono text-xs text-muted mt-1">Placed {day(order.paid_at || order.created_at)}</p>
        </div>
        <span
          className={`gp-mono text-xs uppercase font-bold px-3 py-1.5 border-[3px] border-ink ${
            cancelled ? 'bg-white text-ink' : shipped ? 'bg-ink text-paper' : 'bg-poster text-white'
          }`}
        >
          {cancelled ? 'Cancelled' : shipped ? 'Shipped' : 'Confirmed'}
        </span>
      </div>

      {!cancelled && (
        <ol className="flex flex-wrap gap-2 mt-5">
          <Step done label="Paid" date={day(order.paid_at || order.created_at)} />
          <Step done={shipped} label="Shipped" date={day(order.shipped_at)} />
        </ol>
      )}

      {shipped && order.tracking_number && (
        <div className="mt-5 bg-ink text-paper p-4">
          <p className="gp-mono text-xs uppercase font-bold text-[#FF6A5E]">{order.carrier || 'India Post'} tracking number</p>
          <p className="gp-display text-2xl mt-1 break-all select-all">{order.tracking_number}</p>
          {viaIndiaPost && (
            <a href={INDIA_POST_TRACKING} target="_blank" rel="noopener noreferrer" className="gp-mono text-sm underline mt-2 inline-block">
              Track on India Post →
            </a>
          )}
        </div>
      )}
      {shipped && !order.tracking_number && (
        <p className="mt-5 text-[15px]">It&apos;s on its way. We didn&apos;t add a tracking number for this one. Write to us if you need help finding it.</p>
      )}
      {order.status === 'confirmed' && (
        <p className="mt-5 text-[15px]">We&apos;re packing your order. You&apos;ll get an email with the tracking number as soon as it ships, and it will show up here too.</p>
      )}

      {cancelled && (
        <div className="mt-5 border-[3px] border-ink p-4">
          <p className="gp-mono text-xs uppercase font-bold">Cancelled {day(order.cancelled_at)}</p>
          {order.cancellation_reason && <p className="mt-2 text-[15px]">Reason: {order.cancellation_reason}</p>}
          <p className="mt-2 text-[15px]">
            {order.refund_proof_url
              ? 'Your refund has been processed.'
              : 'Your money is being refunded to the way you paid. It usually shows up within 5 to 7 working days.'}
          </p>
          {order.refund_proof_url && (
            <a href={order.refund_proof_url} target="_blank" rel="noopener noreferrer" className="gp-mono text-sm underline mt-2 inline-block">
              View refund proof →
            </a>
          )}
        </div>
      )}

      <ul className="mt-6 border-t-2 border-dashed border-ink">
        {(order.items || []).map((item, i) => (
          <li key={i} className="flex justify-between gap-4 py-2.5 border-b border-ink/20 gp-mono text-sm">
            <span>
              {item.quantity || 1} × {item.product?.name || 'Item'}
              {item.size && item.size !== 'One Size' ? ` / ${item.size}` : ''}
            </span>
            {item.product?.price ? <span className="whitespace-nowrap">{rupees(Number(item.product.price) * (item.quantity || 1))}</span> : null}
          </li>
        ))}
        <li className="flex justify-between gap-4 pt-3 gp-mono text-base font-bold">
          <span>TOTAL{cancelled ? ' (REFUNDED)' : ' PAID'}</span>
          <span>{rupees(order.total_amount)}</span>
        </li>
      </ul>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="gp-mono text-xs uppercase font-bold mb-1.5">{cancelled ? 'Was shipping to' : 'Shipping to'}</p>
          <p className="text-[15px] leading-relaxed">
            {order.customer_name}
            {place.map((line, i) => (
              <span key={i} className="block">{line}</span>
            ))}
          </p>
        </div>
        {order.gateway_payment_id && (
          <div>
            <p className="gp-mono text-xs uppercase font-bold mb-1.5">Payment</p>
            <p className="gp-mono text-xs break-all text-muted">PhonePe · {order.gateway_payment_id}</p>
          </div>
        )}
      </div>
    </article>
  );
}
