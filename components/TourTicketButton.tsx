'use client';

import { trackEvent } from '@/lib/analytics';

interface Props {
  href: string;
  venueName: string;
  city: string;
  date: string;
}

export default function TourTicketButton({ href, venueName, city, date }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-primary whitespace-nowrap"
      onClick={() => trackEvent('ticket_click', { venue_name: venueName, city, show_date: date })}
    >
      Get Tickets
    </a>
  );
}
