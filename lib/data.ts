/**
 * Data access layer. Today it returns the local content in lib/content.ts.
 * When the shared starter lands, replace each body with the Supabase query
 * (filtered by site_id) — signatures stay the same, so no component changes.
 */
import { catchOfDay, closedOverride, faqs, menu, seasons } from "./content";

export async function getMenu() {
  return menu;
}
export async function getSeasons() {
  return seasons;
}
export async function getClosedOverride() {
  return closedOverride;
}
export async function getFaqs() {
  return faqs;
}
export async function getCatchOfDay() {
  return catchOfDay;
}
