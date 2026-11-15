import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bus, Clock, Search, X } from 'lucide-react';
import type {
  BusPlaceScheduleResponse,
  BusPlaceSummary,
  BusRouteSchedule,
} from '../types/news';
import { BusTimingsAgent } from './BusTimingsAgent';

type DayPeriodFilter = 'All' | 'Morning' | 'Afternoon' | 'Evening';

interface BusTimingsSectionProps {
  onBackToNews?: () => void;
}

function getDayPeriod(formattedTime: string): Exclude<DayPeriodFilter, 'All'> {
  const isPm = formattedTime.endsWith('PM');
  const hourPart = Number(formattedTime.split(':')[0]);
  const hour24 = isPm ? (hourPart === 12 ? 12 : hourPart + 12) : hourPart === 12 ? 0 : hourPart;

  if (hour24 >= 4 && hour24 < 12) return 'Morning';
  if (hour24 >= 12 && hour24 < 17) return 'Afternoon';
  return 'Evening';
}

export function BusTimingsSection({ onBackToNews }: BusTimingsSectionProps) {
  const [selectedTitleId, setSelectedTitleId] = useState<number>(1);
  const [reloadTick, setReloadTick] = useState<number>(0);
  const [places, setPlaces] = useState<BusPlaceSummary[]>([]);
  const [activePlace, setActivePlace] = useState<BusPlaceSummary | null>(null);
  const [routes, setRoutes] = useState<BusRouteSchedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [periodFilter, setPeriodFilter] = useState<DayPeriodFilter>('All');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    fetch(`/api/bus-timings?titleId=${selectedTitleId}`)
      .then(async (res) => {
        if (!res.ok) {
          const errJson = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(errJson.error || 'Could not load bus timings.');
        }
        return (await res.json()) as BusPlaceScheduleResponse;
      })
      .then((data) => {
        if (cancelled) return;
        setPlaces(data.places || []);
        setActivePlace(data.activePlace || null);
        setRoutes(data.routes || []);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Unable to load bus timings.');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedTitleId, reloadTick]);

  const filteredRoutes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return routes
      .map((route) => {
        const routeMatchesQuery =
          !q ||
          route.description.toLowerCase().includes(q) ||
          route.routeName.toLowerCase().includes(q);

        const matchingTimings = route.timings.filter((t) => {
          if (periodFilter !== 'All' && getDayPeriod(t.departureTime) !== periodFilter) {
            return false;
          }
          if (q && !routeMatchesQuery) {
            const hay = `${t.busName} ${t.remarks} ${t.departureTime}`.toLowerCase();
            return hay.includes(q);
          }
          return true;
        });

        if (matchingTimings.length === 0) return null;
        return {
          ...route,
          timings: matchingTimings,
        };
      })
      .filter((item): item is BusRouteSchedule => item !== null);
  }, [routes, searchQuery, periodFilter]);

  const totalBusesShown = useMemo(
    () => filteredRoutes.reduce((sum, r) => sum + r.timings.length, 0),
    [filteredRoutes]
  );

  return (
    <section
      id="bus-timings"
      aria-label="Bus Timings"
      className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
    >
      {/* Back to News bar when opened as a separate page */}
      {onBackToNews && (
        <div className="mb-5">
          <button
            type="button"
            onClick={onBackToNews}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#0F274A] bg-white border border-slate-200 hover:border-[#0F274A] rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>
              Back to News · <span className="font-kannada">ಸುದ್ದಿಗಳಿಗೆ ಹಿಂತಿರುಗಿ</span>
            </span>
          </button>
        </div>
      )}

      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F274A] mb-1">
            <Bus className="w-4 h-4" aria-hidden="true" />
            <span>Transport Schedule · ಸಾರಿಗೆ ವೇಳಾಪಟ್ಟಿ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F274A] tracking-tight">
            Bus Timings · <span className="font-kannada">ಬಸ್ ವೇಳಾಪಟ್ಟಿ</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            KSRTC and private bus departure timings across Koppa Taluk &amp; Malnad
          </p>
        </div>

        <div className="text-xs font-medium text-slate-500 tabular-nums">
          {activePlace ? `${activePlace.nameEn} (${activePlace.nameKn})` : 'Koppa'} ·{' '}
          {filteredRoutes.length} routes · {totalBusesShown} departures
        </div>
      </div>

      {/* Bilingual Two-Section AI Bus Finder (1. From Where & 2. To Where) */}
      <BusTimingsAgent />

      <div className="mb-4 pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
        <h2 className="text-base sm:text-lg font-extrabold text-[#0F274A]">
          Browse All Routes by Town ·{' '}
          <span className="font-kannada font-bold">ಊರುಗಳ ಪ್ರಕಾರ ಎಲ್ಲಾ ಬಸ್‌ಗಳು</span>
        </h2>
      </div>

      {/* Origin Town Selector */}
      {places.length > 0 && (
        <div
          role="tablist"
          aria-label="Select departure town"
          className="flex items-center gap-2 overflow-x-auto pb-2 mb-4"
        >
          {places.map((place) => {
            const isActive = activePlace?.titleId === place.titleId;
            return (
              <button
                key={place.titleId}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => setSelectedTitleId(place.titleId)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px] ${
                  isActive
                    ? 'bg-[#0F274A] text-white border-[#0F274A]'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span>{place.nameEn}</span>
                <span className="font-kannada opacity-80">({place.nameKn})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Search and Time-of-Day Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="relative w-full sm:w-80">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search destination, route, or bus..."
            aria-label="Search bus routes or operators"
            className="w-full pl-9 pr-9 py-2 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0F274A] min-h-[40px]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear bus search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div
          role="group"
          aria-label="Filter buses by time of day"
          className="inline-flex items-center bg-white border border-slate-200 rounded-xl p-1 overflow-x-auto self-start sm:self-auto"
        >
          {(['All', 'Morning', 'Afternoon', 'Evening'] as DayPeriodFilter[]).map((period) => {
            const active = periodFilter === period;
            return (
              <button
                key={period}
                type="button"
                onClick={() => setPeriodFilter(period)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active ? 'bg-[#0F274A] text-white' : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {period === 'Evening' ? 'Evening & Night' : period}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading / Error / Route Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
            >
              <div className="h-4 w-2/3 bg-slate-200 rounded" />
              <div className="h-3 w-1/2 bg-slate-100 rounded" />
              <div className="h-20 bg-slate-50 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white border border-red-200 rounded-xl p-6 text-center">
          <p className="text-sm font-medium text-red-800 mb-3">{error}</p>
          <button
            type="button"
            onClick={() => setReloadTick((prev) => prev + 1)}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#0F274A] rounded-lg cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : filteredRoutes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-sm font-medium text-slate-700 mb-3">
            No bus departures match your search or time filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setPeriodFilter('All');
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#0F274A] rounded-lg cursor-pointer"
          >
            Show All Departures
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRoutes.map((route) => {
            const isGenericRouteName = /^route\s*\d+$/i.test(route.routeName.trim());
            const mainTitle =
              isGenericRouteName && route.description.trim()
                ? route.description.trim()
                : route.routeName.trim() || route.description.trim();
            const subNote =
              !isGenericRouteName && route.description.trim() ? route.description.trim() : '';

            return (
              <article
                key={route.routeId}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col"
              >
                <div className="px-4 py-3.5 border-b border-slate-200 bg-slate-50/70">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-500 mb-1">
                    <span className="uppercase tracking-wider text-[#0F274A]">
                      {isGenericRouteName
                        ? route.routeName
                        : `${activePlace?.nameEn || 'Bus'} Route`}
                    </span>
                    <span className="tabular-nums">{route.timings.length} buses</span>
                  </div>
                  <h3 className="font-kannada text-sm sm:text-base font-bold text-slate-900 leading-snug">
                    {mainTitle}
                  </h3>
                  {subNote && (
                    <p className="font-kannada text-xs text-slate-600 mt-0.5">{subNote}</p>
                  )}
                </div>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {route.timings.map((item) => (
                  <div
                    key={item.timingId}
                    className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm"
                  >
                    <div className="flex items-center gap-2 font-bold text-[#0F274A] tabular-nums whitespace-nowrap shrink-0">
                      <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden="true" />
                      <span>{item.departureTime}</span>
                    </div>

                    <div className="text-right min-w-0">
                      <div className="font-kannada font-semibold text-slate-900 truncate">
                        {item.busName}
                      </div>
                      {item.remarks && (
                        <div className="font-kannada text-[11px] text-slate-500 truncate">
                          {item.remarks}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
