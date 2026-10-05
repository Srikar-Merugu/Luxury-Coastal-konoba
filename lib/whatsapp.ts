import { venue } from "./content";

/** wa.me wants the number as digits only, with the country code. */
export function waNumber(phone: string) {
  return phone.replace(/[^\d+]/g, "").replace(/^\+/, "").replace(/^00/, "");
}

/** Click-to-chat link to the venue (NEXT_PUBLIC_WHATSAPP_NUMBER overrides the listed phone). */
export function venueWhatsApp(text?: string) {
  const n = waNumber(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || venue.phoneHref);
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** Click-to-chat link from the owner to a guest. */
export function guestWhatsApp(phone: string, text: string) {
  return `https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(text)}`;
}
