import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { getCategories } from '../api/catalog';
import { CategoryCard } from '../components/cards/CategoryCard';
import { CardSkeletonGrid } from '../components/ui/CardSkeleton';
import Footer from '../components/Footer';

function HeroIllustration() {
  // Abstract calendar/checkmark composition — same visual family as the
  // LogoMark used in Navbar/Footer/AuthLayout. No stock photography, since
  // there's no per-category imagery in the data model yet.
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full max-w-md" fill="none">
      <rect x="60" y="90" width="280" height="230" rx="20" className="fill-white/10" />
      <rect x="60" y="90" width="280" height="60" rx="20" className="fill-white/20" />
      <circle cx="130" cy="70" r="10" className="fill-white/40" />
      <circle cx="270" cy="70" r="10" className="fill-white/40" />
      <g className="fill-white/25">
        <rect x="95" y="175" width="45" height="45" rx="8" />
        <rect x="155" y="175" width="45" height="45" rx="8" />
        <rect x="215" y="175" width="45" height="45" rx="8" />
        <rect x="275" y="175" width="45" height="45" rx="8" />
        <rect x="95" y="235" width="45" height="45" rx="8" />
        <rect x="155" y="235" width="45" height="45" rx="8" />
      </g>
      <g>
        <rect x="215" y="235" width="105" height="45" rx="8" className="fill-white" />
        <path
          d="M235 257l10 10 20-20"
          stroke="#4F46E5"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

const FEATURES = [
  {
    title: 'Live availability',
    body: 'See a provider\u2019s open time slots the moment they set them — no back-and-forth to find a time that works.',
  },
  {
    title: 'No double-booking',
    body: 'Every reservation is checked against the provider\u2019s calendar the instant it\u2019s made, so a slot can\u2019t be booked twice.',
  },
  {
    title: 'Any kind of service',
    body: 'Categories adapt to what\u2019s being booked — single sessions, day rentals, or recurring monthly slots.',
  },
];

const STEPS = [
  {
    title: 'Pick a category',
    body: 'Start from the type of service you\u2019re looking for.',
  },
  {
    title: 'Choose what you need',
    body: 'Drill into a provider\u2019s service, then the specific element you want to book.',
  },
  {
    title: 'Select an open time',
    body: 'Pick from the provider\u2019s real availability on the calendar.',
  },
  {
    title: 'Get instant confirmation',
    body: 'Your booking is confirmed immediately — no waiting on approval.',
  },
];

export default function Home() {
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  return (
    <div className="bg-white">
      

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid items-center gap-10 rounded-3xl bg-indigo-600 px-8 py-14 sm:px-14 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              Book any service, on your schedule.
            </h1>
            <p className="mt-4 max-w-md text-indigo-100">
              Reservo brings every provider's calendar into one place. Browse
              categories, pick a time, and you're booked in seconds.
            </p>
            <Link
              to="/categories"
              className="mt-8 inline-block rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-50"
            >
              Browse categories
            </Link>
          </div>
          <div className="flex justify-center">
            <HeroIllustration />
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="text-center sm:text-left">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 sm:mx-0">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8.5 12l2.5 2.5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{feature.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">How it works</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <div key={step.title}>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                {index + 1}
              </span>
              <h3 className="mt-4 text-base font-bold text-slate-900">{step.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Category push — featured 3 categories + CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Ready to see what's available?
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-500">
              Every category on Reservo is run by a real provider with a live
              calendar — explore what's bookable right now.
            </p>
          </div>
          <Link
            to="/categories"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            View all categories
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>

        <div className="mt-8">
          {isLoading && <CardSkeletonGrid count={3} />}

          {error && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              Unable to load categories right now.
            </div>
          )}

          {!isLoading && !error && categories && categories.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categories.slice(0, 3).map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}

          {!isLoading && !error && (!categories || categories.length === 0) && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-base font-semibold text-slate-800">
                No categories available yet
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Check back soon as providers add new services and categories.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}