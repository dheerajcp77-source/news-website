import { useState, type FormEvent } from 'react';
import {
  ArrowLeftRight,
  ArrowRight,
  Bus,
  Clock,
  MapPin,
  RotateCcw,
  Send,
  Sparkles,
} from 'lucide-react';
import type {
  BusAgentChatTurn,
  BusAgentMatchedRoute,
  BusAgentResponse,
  BusAgentTimePreference,
} from '../types/news';

interface AgentConversationEntry {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  origin?: string;
  destination?: string;
  matchedRoutes?: BusAgentMatchedRoute[];
  suggestedHubs?: string[];
}

interface TownOption {
  en: string;
  kn: string;
}

const ORIGIN_TOWN_OPTIONS: TownOption[] = [
  { en: 'Koppa', kn: 'ಕೊಪ್ಪ' },
  { en: 'Jayapura', kn: 'ಜಯಪುರ' },
  { en: 'Balehonnur', kn: 'ಬಾಳೆಹೊನ್ನೂರು' },
  { en: 'N.R. Pura', kn: 'ಎನ್.ಆರ್ ಪುರ' },
  { en: 'Sringeri', kn: 'ಶೃಂಗೇರಿ' },
  { en: 'Thirthahalli', kn: 'ತೀರ್ಥಹಳ್ಳಿ' },
  { en: 'Chikkamagaluru', kn: 'ಚಿಕ್ಕಮಗಳೂರು' },
  { en: 'Shivamogga', kn: 'ಶಿವಮೊಗ್ಗ' },
  { en: 'Mangaluru', kn: 'ಮಂಗಳೂರು' },
  { en: 'Udupi', kn: 'ಉಡುಪಿ' },
  { en: 'Kalasa', kn: 'ಕಳಸ' },
  { en: 'Horanadu', kn: 'ಹೊರನಾಡು' },
];

const DESTINATION_TOWN_OPTIONS: TownOption[] = [
  { en: 'Shivamogga', kn: 'ಶಿವಮೊಗ್ಗ' },
  { en: 'Koppa', kn: 'ಕೊಪ್ಪ' },
  { en: 'Mangaluru', kn: 'ಮಂಗಳೂರು' },
  { en: 'Chikkamagaluru', kn: 'ಚಿಕ್ಕಮಗಳೂರು' },
  { en: 'Bengaluru', kn: 'ಬೆಂಗಳೂರು' },
  { en: 'Udupi', kn: 'ಉಡುಪಿ' },
  { en: 'Sringeri', kn: 'ಶೃಂಗೇರಿ' },
  { en: 'Jayapura', kn: 'ಜಯಪುರ' },
  { en: 'Balehonnur', kn: 'ಬಾಳೆಹೊನ್ನೂರು' },
  { en: 'N.R. Pura', kn: 'ಎನ್.ಆರ್ ಪುರ' },
  { en: 'Thirthahalli', kn: 'ತೀರ್ಥಹಳ್ಳಿ' },
  { en: 'Horanadu', kn: 'ಹೊರನಾಡು' },
];

const TIME_OPTIONS: { value: BusAgentTimePreference; labelEn: string; labelKn: string }[] = [
  { value: 'all', labelEn: 'All Day', labelKn: 'ಇಡೀ ದಿನ' },
  { value: 'morning', labelEn: 'Morning', labelKn: 'ಬೆಳಿಗ್ಗೆ' },
  { value: 'afternoon', labelEn: 'Afternoon', labelKn: 'ಮಧ್ಯಾಹ್ನ' },
  { value: 'evening', labelEn: 'Evening & Night', labelKn: 'ಸಂಜೆ / ರಾತ್ರಿ' },
];

const INITIAL_ASSISTANT_ENTRY: AgentConversationEntry = {
  id: 'welcome',
  role: 'assistant',
  text:
    'Select or type "1. From Where" and "2. To Where" above, or ask me directly below to see all matching buses.\n' +
    'ಮೇಲಿನ "೧. ಎಲ್ಲಿಂದ" ಮತ್ತು "೨. ಎಲ್ಲಿಗೆ" ವಿಭಾಗಗಳಲ್ಲಿ ಊರನ್ನು ಆಯ್ಕೆಮಾಡಿ, ಅಥವಾ ಕೆಳಗೆ ನೇರವಾಗಿ ಕೇಳಿ ಎಲ್ಲಾ ಬಸ್ ವೇಳಾಪಟ್ಟಿಯನ್ನು ಪಡೆಯಿರಿ.',
};

export function BusTimingsAgent() {
  const [fromTown, setFromTown] = useState<string>('');
  const [toTown, setToTown] = useState<string>('');
  const [timePreference, setTimePreference] = useState<BusAgentTimePreference>('all');
  const [entries, setEntries] = useState<AgentConversationEntry[]>([INITIAL_ASSISTANT_ENTRY]);
  const [chatInput, setChatInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [lastStatus, setLastStatus] = useState<BusAgentResponse['status'] | null>(null);

  const runAgentRequest = async (
    payload: {
      origin?: string;
      destination?: string;
      timePreference?: BusAgentTimePreference;
      messages?: BusAgentChatTurn[];
    },
    userBubbleText: string,
    preserveFollowUp = false
  ) => {
    if (loading) return;
    setError('');

    const userEntry: AgentConversationEntry = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: userBubbleText,
    };

    if (preserveFollowUp) {
      setEntries((prev) => [...prev.filter((item) => item.id !== 'welcome'), userEntry]);
    } else {
      setEntries([userEntry]);
    }
    setLoading(true);

    try {
      const resp = await fetch('/api/bus-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await resp.json().catch(() => ({}))) as Partial<BusAgentResponse> & {
        error?: string;
      };

      if (!resp.ok) {
        throw new Error(data.error || 'Could not load matching buses.');
      }

      if (data.origin) {
        setFromTown(data.origin.split(' (')[0]);
      }
      if (data.destination) {
        setToTown(data.destination.split(' (')[0]);
      }

      const nextStatus = data.status || 'ready';
      setLastStatus(nextStatus);

      const assistantEntry: AgentConversationEntry = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: data.reply || 'Here are the matching bus timings.',
        origin: data.origin,
        destination: data.destination,
        matchedRoutes: data.matchedRoutes || [],
        suggestedHubs: data.suggestedHubs || [],
      };

      if (nextStatus === 'ready' || !preserveFollowUp) {
        setEntries([userEntry, assistantEntry]);
      } else {
        setEntries((prev) => [...prev, assistantEntry]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to check bus timings right now.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTwoStepSubmit = (e: FormEvent) => {
    e.preventDefault();
    const o = fromTown.trim();
    const d = toTown.trim();
    const userLabel =
      o && d
        ? `1. From: ${o} → 2. To: ${d}`
        : o
          ? `1. From: ${o}`
          : d
            ? `2. To: ${d}`
            : 'Check bus timings';

    void runAgentRequest(
      {
        origin: o,
        destination: d,
        timePreference,
      },
      userLabel,
      false
    );
  };

  const handleChatSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed || loading) return;

    const isFollowUp =
      lastStatus === 'needs_origin' ||
      lastStatus === 'needs_destination' ||
      lastStatus === 'needs_both';

    const apiTurns: BusAgentChatTurn[] = isFollowUp
      ? [
          ...entries
            .filter((item) => item.id !== 'welcome')
            .map((item) => ({ role: item.role, text: item.text })),
          { role: 'user', text: trimmed },
        ]
      : [{ role: 'user', text: trimmed }];

    setChatInput('');
    void runAgentRequest({ messages: apiTurns }, trimmed, isFollowUp);
  };

  const handleSwapTowns = () => {
    setFromTown(toTown);
    setToTown(fromTown);
  };

  const handleReset = () => {
    setFromTown('');
    setToTown('');
    setTimePreference('all');
    setChatInput('');
    setLastStatus(null);
    setEntries([INITIAL_ASSISTANT_ENTRY]);
    setError('');
  };

  const hasConversation = entries.some((e) => e.id !== 'welcome');

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs mb-8">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 bg-[#0F274A] text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-[#0F274A] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold leading-tight">
              AI Bus Route Finder · <span className="font-kannada font-bold">ಬಸ್ ಮಾರ್ಗ ಸಹಾಯಕ</span>
            </h2>
            <p className="text-xs text-slate-200 mt-0.5">
              Enter 1. From Where &amp; 2. To Where ·{' '}
              <span className="font-kannada">೧. ಎಲ್ಲಿಂದ ಮತ್ತು ೨. ಎಲ್ಲಿಗೆ ಎಂದು ನಮೂದಿಸಿ</span>
            </p>
          </div>
        </div>

        {hasConversation && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>New Search · ಹೊಸ ಹುಡುಕಾಟ</span>
          </button>
        )}
      </div>

      {/* Dedicated Two-Section Bilingual Finder: 1. From Where & 2. To Where */}
      <form
        onSubmit={handleTwoStepSubmit}
        className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-11 gap-3.5 items-stretch">
          {/* Section 1: From Where / ಎಲ್ಲಿಂದ */}
          <div className="md:col-span-5 bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-[#0F274A] text-white text-xs font-bold inline-flex items-center justify-center shrink-0">
                  1
                </span>
                <label
                  htmlFor="bus-from-input"
                  className="text-sm font-extrabold text-[#0F274A]"
                >
                  From Where ·{' '}
                  <span className="font-kannada font-bold">೧. ಎಲ್ಲಿಂದ</span>
                </label>
              </div>
              <p className="text-xs text-slate-500 mb-2.5">
                Starting town ·{' '}
                <span className="font-kannada">ನೀವು ಹೊರಡುವ ಊರು</span>
              </p>

              <div className="relative">
                <MapPin
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="bus-from-input"
                  type="text"
                  value={fromTown}
                  onChange={(e) => setFromTown(e.target.value)}
                  placeholder="e.g. Koppa / ಕೊಪ್ಪ"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#0F274A] min-h-[42px]"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {ORIGIN_TOWN_OPTIONS.map((town) => {
                const active = fromTown.trim().toLowerCase() === town.en.toLowerCase();
                return (
                  <button
                    key={town.en}
                    type="button"
                    onClick={() => setFromTown(town.en)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#0F274A] text-white border-[#0F274A]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {town.en} <span className="font-kannada opacity-80">({town.kn})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-1 flex items-center justify-center">
            <button
              type="button"
              onClick={handleSwapTowns}
              aria-label="Swap From and To towns"
              title="Swap From & To / ಅದಲು ಬದಲು"
              className="w-10 h-10 rounded-full bg-white border border-slate-200 hover:border-[#0F274A] text-[#0F274A] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            >
              <ArrowLeftRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Section 2: To Where / ಎಲ್ಲಿಗೆ */}
          <div className="md:col-span-5 bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-[#0F274A] text-xs font-extrabold inline-flex items-center justify-center shrink-0">
                  2
                </span>
                <label
                  htmlFor="bus-to-input"
                  className="text-sm font-extrabold text-[#0F274A]"
                >
                  To Where ·{' '}
                  <span className="font-kannada font-bold">೨. ಎಲ್ಲಿಗೆ</span>
                </label>
              </div>
              <p className="text-xs text-slate-500 mb-2.5">
                Destination town ·{' '}
                <span className="font-kannada">ನೀವು ತಲುಪುವ ಊರು</span>
              </p>

              <div className="relative">
                <MapPin
                  className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="bus-to-input"
                  type="text"
                  value={toTown}
                  onChange={(e) => setToTown(e.target.value)}
                  placeholder="e.g. Shivamogga / ಶಿವಮೊಗ್ಗ"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#0F274A] min-h-[42px]"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {DESTINATION_TOWN_OPTIONS.map((town) => {
                const active = toTown.trim().toLowerCase() === town.en.toLowerCase();
                return (
                  <button
                    key={town.en}
                    type="button"
                    onClick={() => setToTown(town.en)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#0F274A] text-white border-[#0F274A]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {town.en} <span className="font-kannada opacity-80">({town.kn})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Time Preference + Primary Find Buses Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div
            role="group"
            aria-label="Preferred travel time"
            className="inline-flex flex-wrap items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1"
          >
            {TIME_OPTIONS.map((opt) => {
              const active = timePreference === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTimePreference(opt.value)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    active ? 'bg-[#0F274A] text-white' : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  {opt.labelEn} · <span className="font-kannada">{opt.labelKn}</span>
                </button>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#0F274A] hover:bg-[#173a6e] disabled:opacity-50 rounded-xl transition-colors cursor-pointer min-h-[44px] shrink-0"
          >
            <Bus className="w-4 h-4 text-amber-400" aria-hidden="true" />
            <span>
              Find Buses · <span className="font-kannada">ಬಸ್ ಹುಡುಕಿ</span>
            </span>
          </button>
        </div>
      </form>

      {/* Assistant Results & Conversation Thread */}
      <div className="p-4 sm:p-6 space-y-4 bg-white max-h-[680px] overflow-y-auto">
        {entries.map((entry) => {
          if (entry.role === 'user') {
            return (
              <div key={entry.id} className="flex justify-end">
                <div className="max-w-lg bg-[#0F274A] text-white px-4 py-2.5 rounded-2xl rounded-br-sm text-sm font-medium">
                  {entry.text}
                </div>
              </div>
            );
          }

          const routes = entry.matchedRoutes || [];
          const totalDepartures = routes.reduce((sum, r) => sum + r.timings.length, 0);
          const lines = entry.text.split('\n').filter(Boolean);

          return (
            <div key={entry.id} className="space-y-3">
              <div className="max-w-3xl bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-sm text-sm text-slate-800 leading-relaxed space-y-1">
                {lines.map((line, i) => (
                  <p key={i} className={i > 0 ? 'font-kannada text-slate-700' : 'font-medium'}>
                    {line}
                  </p>
                ))}

                {entry.origin && entry.destination && routes.length > 0 && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                    <div className="inline-flex items-center gap-1.5 font-semibold text-[#0F274A]">
                      <span>{entry.origin}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                      <span>{entry.destination}</span>
                    </div>
                    <span className="font-semibold tabular-nums text-slate-500">
                      {totalDepartures} bus{totalDepartures === 1 ? '' : 'es'} · {routes.length}{' '}
                      route{routes.length === 1 ? '' : 's'}
                    </span>
                  </div>
                )}

                {entry.suggestedHubs && entry.suggestedHubs.length > 0 && entry.origin && entry.destination && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {entry.suggestedHubs.map((hub) => {
                      const originShort = entry.origin?.split(' (')[0] || '';
                      const destShort = entry.destination?.split(' (')[0] || '';
                      return (
                        <div key={hub} className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              void runAgentRequest(
                                { origin: originShort, destination: hub, timePreference },
                                `1. From: ${originShort} → 2. To: ${hub}`
                              )
                            }
                            className="px-2.5 py-1.5 text-xs font-semibold text-[#0F274A] bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            {originShort} → {hub}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void runAgentRequest(
                                { origin: hub, destination: destShort, timePreference },
                                `1. From: ${hub} → 2. To: ${destShort}`
                              )
                            }
                            className="px-2.5 py-1.5 text-xs font-semibold text-[#0F274A] bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            {hub} → {destShort}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Matched Bus Route Schedules */}
              {routes.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {routes.map((route) => (
                    <div
                      key={`${entry.id}-${route.routeId}`}
                      className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col"
                    >
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                        <div className="flex items-center justify-between gap-2 text-[11px] font-semibold mb-1">
                          <span className="inline-flex items-center gap-1.5 text-[#0F274A]">
                            <Bus className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden="true" />
                            <span>{route.fromPlaceLabel}</span>
                          </span>
                          <span className="text-slate-500 tabular-nums shrink-0">
                            {route.timings.length} bus{route.timings.length === 1 ? '' : 'es'}
                          </span>
                        </div>
                        <h4 className="font-kannada text-sm font-bold text-slate-900 leading-snug">
                          {route.routeTitle}
                        </h4>
                        {route.routeSubtitle && (
                          <p className="font-kannada text-xs text-slate-600 mt-0.5">
                            {route.routeSubtitle}
                          </p>
                        )}
                      </div>

                      <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                        {route.timings.map((item) => (
                          <div
                            key={item.timingId}
                            className="px-4 py-2 flex items-center justify-between gap-3 text-xs sm:text-sm"
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="max-w-md bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-sm text-xs sm:text-sm font-medium text-slate-600">
            Checking bus schedules... ·{' '}
            <span className="font-kannada">ಬಸ್ ವೇಳಾಪಟ್ಟಿ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...</span>
          </div>
        )}

        {error && (
          <div className="max-w-xl bg-red-50 border border-red-200 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium text-red-800 whitespace-pre-line">
            {error}
          </div>
        )}
      </div>

      {/* Optional Free-Text AI Assistant Chat Bar */}
      <div className="p-4 sm:px-6 border-t border-slate-200 bg-slate-50/70">
        <form onSubmit={handleChatSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Or ask AI directly: e.g. Koppa to Shivamogga / ಕೊಪ್ಪದಿಂದ ಶಿವಮೊಗ್ಗ..."
            aria-label="Ask AI Bus Route Assistant in English or Kannada"
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0F274A] min-h-[42px]"
          />
          <button
            type="submit"
            disabled={loading || !chatInput.trim()}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#0F274A] bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors cursor-pointer min-h-[42px] shrink-0"
          >
            <span>Ask AI · ಕೇಳಿ</span>
            <Send className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  );
}
