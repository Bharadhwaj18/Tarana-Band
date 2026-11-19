'use client';

import { trackEvent } from '@/lib/analytics';

interface Props {
  href: string;
  venueName: string;
  city: string;
  date: string;
  className?: string;
}

export default function TourTicketButton({ href, venueName, city, date, className = 'gp-btn gp-btn-red whitespace-nowrap' }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => trackEvent('ticket_click', { venue_name: venueName, city, show_date: date })}
    >
      Get tickets ↗
    </a>
  );
}
