import { venue } from "./content";

/**
 * Live conditions at the cove from Open-Meteo (free, no key): air and sea
 * temperature, sky and wind. Kvarner has two named winds that matter to a
 * terrace: bura (cold, gusty, from the north-east) and jugo (warm, from the
 * south-east). Cached for 15 minutes; any failure just hides the bar.
 */

export type Sky = "clear" | "cloudy" | "fog" | "rain" | "storm";
export type Wind = "calm" | "breeze" | "bura" | "strongBura" | "jugo" | "windy";
export type CoastNow = { air: number; sea: number | null; sky: Sky; wind: Wind; gusts: number; isDay: boolean };

function sky(code: number): Sky {
  if (code <= 1) return "clear";
  if (code <= 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 95) return "storm";
  return "rain";
}

function wind(speed: number, gusts: number, dir: number): Wind {
  const fromNE = dir >= 10 && dir <= 100;
  const fromSE = dir > 100 && dir <= 180;
  if (fromNE && gusts >= 60) return "strongBura";
  if (fromNE && gusts >= 35) return "bura";
  if (fromSE && speed >= 20) return "jugo";
  if (speed >= 30) return "windy";
  if (speed >= 12) return "breeze";
  return "calm";
}

const q = `latitude=${venue.geo.lat}&longitude=${venue.geo.lng}&timezone=Europe%2FZagreb`;

export async function getCoastNow(): Promise<CoastNow | null> {
  try {
    const opts = { next: { revalidate: 900 } } as RequestInit;
    const [w, m] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?${q}&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,is_day`, opts).then((r) =>
        r.ok ? r.json() : null,
      ),
      fetch(`https://marine-api.open-meteo.com/v1/marine?${q}&current=sea_surface_temperature`, opts)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]);
    const c = w?.current;
    if (!c) return null;
    const sea = m?.current?.sea_surface_temperature;
    return {
      air: Math.round(c.temperature_2m),
      sea: typeof sea === "number" ? Math.round(sea) : null,
      sky: sky(c.weather_code),
      wind: wind(c.wind_speed_10m, c.wind_gusts_10m, c.wind_direction_10m),
      gusts: Math.round(c.wind_gusts_10m),
      isDay: c.is_day === 1,
    };
  } catch {
    return null;
  }
}
