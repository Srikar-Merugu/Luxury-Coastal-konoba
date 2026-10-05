import Link from "next/link";
import { getCatchOfDay, getClosedOverride } from "@/lib/data";
import { SITE_ID, supabaseConfigured } from "@/lib/supabase";
import { currentAdmin } from "@/lib/supabase-server";
import { setBookingStatus, signOut } from "./actions";
import { CatchEditor, LoginForm, SeasonForm } from "./forms";

export const dynamic = "force-dynamic";

type Booking = {
  id: string;
  date: string;
  time: string;
  party_size: number;
  seating: string;
  large_group: boolean;
  name: string;
  phone: string;
  email: string;
  note: string;
  locale: string;
  status: "pending" | "confirmed" | "declined";
  created_at: string;
};

const card = "border border-deep/10 bg-white p-6 md:p-8";
const h2 = "text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  if (!supabaseConfigured) {
    return (
      <Shell>
        <div className={card}>
          <p className={h2}>Not connected</p>
          <p className="mt-4 max-w-prose text-ink-soft">
            Supabase is not configured for this deployment. Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, run <code>supabase/schema.sql</code> and <code>supabase/seed.sql</code>, then
            reload. See the README.
          </p>
        </div>
      </Shell>
    );
  }

  const { supabase, user, allowed } = await currentAdmin();
  if (!user) {
    return (
      <Shell>
        <LoginForm />
      </Shell>
    );
  }
  if (!allowed) {
    return (
      <Shell email={user.email}>
        <div className={card}>
          <p className={h2}>No access</p>
          <p className="mt-4 text-ink-soft">
            {user.email} is signed in but is not an admin of this site. Add the user to the <code>admins</code> table for site{" "}
            <code>{SITE_ID}</code>.
          </p>
        </div>
      </Shell>
    );
  }

  const show = (await searchParams).show === "all" ? "all" : "open";
  let query = supabase.from("booking_requests").select("*").eq("site_id", SITE_ID).order("created_at", { ascending: false }).limit(200);
  if (show === "open") query = query.eq("status", "pending");
  const [{ data: bookings, error }, catchOfDay, override] = await Promise.all([query, getCatchOfDay(), getClosedOverride()]);
  const list = (bookings ?? []) as Booking[];

  return (
    <Shell email={user.email}>
      <section className={card} aria-labelledby="bookings">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 id="bookings" className={h2}>
            Table requests
          </h2>
          <nav className="flex gap-4 text-sm">
            <Link href="/admin" className={show === "open" ? "font-semibold text-deep" : "text-ink-soft hover:text-deep"}>
              Waiting
            </Link>
            <Link href="/admin?show=all" className={show === "all" ? "font-semibold text-deep" : "text-ink-soft hover:text-deep"}>
              All
            </Link>
          </nav>
        </div>
        {error && <p className="mt-4 text-coral">{error.message}</p>}
        {!list.length && <p className="mt-6 text-ink-soft">{show === "open" ? "Nothing waiting. All requests are answered." : "No requests yet."}</p>}
        <ul className="mt-4 divide-y divide-deep/10">
          {list.map((b) => (
            <li key={b.id} className="grid gap-3 py-5 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-lg text-deep">
                  <strong className="font-semibold">{b.name}</strong> · {b.party_size} ppl · {fmt(b.date)} {b.time}
                  {b.large_group && <span className="ml-2 rounded bg-ochre/20 px-2 py-0.5 text-xs uppercase tracking-wider text-deep">Large group</span>}
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  {b.seating} · <a href={`tel:${b.phone}`}>{b.phone}</a> · <a href={`mailto:${b.email}`}>{b.email}</a> · {b.locale.toUpperCase()} ·
                  received {new Date(b.created_at).toLocaleString("en-GB", { timeZone: "Europe/Zagreb", dateStyle: "short", timeStyle: "short" })}
                </p>
                {b.note && <p className="mt-2 text-sm italic text-ink">“{b.note}”</p>}
              </div>
              {b.status === "pending" ? (
                <form action={setBookingStatus} className="flex gap-2">
                  <input type="hidden" name="id" value={b.id} />
                  <button name="status" value="confirmed" className="bg-deep px-4 py-2 text-sm text-stone hover:bg-sea">
                    Confirm
                  </button>
                  <button name="status" value="declined" className="border border-deep/30 px-4 py-2 text-sm text-deep hover:border-coral hover:text-coral">
                    Decline
                  </button>
                </form>
              ) : (
                <span className={`text-sm font-semibold uppercase tracking-wider ${b.status === "confirmed" ? "text-emerald-700" : "text-coral"}`}>
                  {b.status}
                </span>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-ink-soft">Confirm or decline emails the guest in their language.</p>
      </section>

      <section className={card} aria-labelledby="catch">
        <h2 id="catch" className={h2}>
          Catch of the day
        </h2>
        <CatchEditor initial={catchOfDay} />
      </section>

      <section className={card} aria-labelledby="season">
        <h2 id="season" className={h2}>
          Open or closed
        </h2>
        <SeasonForm initial={override} />
        <p className="mt-6 text-xs text-ink-soft">
          Seasons, weekly hours, menu and FAQ are edited in the Supabase table editor (tables <code>seasons</code>,{" "}
          <code>opening_hours</code>, <code>menu_items</code>, <code>faqs</code>). Changes show on the site within a minute, no redeploy.
        </p>
      </section>
    </Shell>
  );
}

function fmt(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}

function Shell({ email, children }: { email?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:py-16">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-ink-soft">Konoba Plavi Kamen</p>
          <h1 className="mt-1 text-3xl font-light text-deep">Owner admin</h1>
        </div>
        {email && (
          <form action={signOut} className="flex items-center gap-4 text-sm text-ink-soft">
            {email}
            <button className="underline hover:text-deep">Sign out</button>
          </form>
        )}
      </header>
      <div className="space-y-8">{children}</div>
      <p className="mt-12 text-xs text-ink-soft">
        Demo concept by{" "}
        <a href="https://kyrostudio.eu" className="underline">
          Kyro Studio
        </a>
        . Fictional venue.
      </p>
    </div>
  );
}
