/**
 * Seats left per time slot. A booking holds its seats from its start time
 * for `minutes` (one sitting). Terrace and indoor have their own seats;
 * "no preference" bookings can sit in either, so they count against the
 * total. Used by the booking form (to show "seats left") and by the booking
 * API (to refuse a request that no longer fits).
 */

export type Capacity = { terrace: number; indoor: number; minutes: number };
export type Usage = { slot: string; seating: string; seats: number };
export type Free = { terrace: number; indoor: number; any: number };

const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

export function freeAt(slot: string, usage: Usage[], cap: Capacity): Free {
  const t = toMin(slot);
  let terrace = 0;
  let indoor = 0;
  let any = 0;
  for (const u of usage) {
    const start = toMin(u.slot);
    if (t < start || t >= start + cap.minutes) continue;
    if (u.seating === "terrace") terrace += u.seats;
    else if (u.seating === "indoor") indoor += u.seats;
    else any += u.seats;
  }
  const freeTerrace = Math.max(0, cap.terrace - terrace);
  const freeIndoor = Math.max(0, cap.indoor - indoor);
  const total = Math.max(0, freeTerrace + freeIndoor - any);
  return { terrace: Math.min(freeTerrace, total), indoor: Math.min(freeIndoor, total), any: total };
}

/** Free seats for the guest's chosen area. */
export function seatsFor(free: Free, seating: string) {
  return seating === "terrace" ? free.terrace : seating === "indoor" ? free.indoor : free.any;
}
