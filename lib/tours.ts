// Upcoming/past is derived from the tour date, not from the stored status,
// so shows move to "past" on their own once the day is over.
// "Today" is the calendar day in India, wherever the code runs.

const TOUR_TIME_ZONE = 'Asia/Kolkata';

export type TourStatus = 'upcoming' | 'past' | 'cancelled';

// Today's date as YYYY-MM-DD
export function getTourToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TOUR_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

// A show stays upcoming through the whole day of the event
export function isTourDatePast(date: string): boolean {
  return date.slice(0, 10) < getTourToday();
}

export function getTourStatus(tour: { date: string; status?: string | null }): TourStatus {
  if (tour.status === 'cancelled') return 'cancelled';
  return isTourDatePast(tour.date) ? 'past' : 'upcoming';
}
