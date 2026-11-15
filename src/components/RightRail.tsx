import { KOPPA_BRIEFS, KOPPA_LOCATIONS, KOPPA_MARKET_RATES } from '../data/newsData';

interface RightRailProps {
  selectedLocation: string;
  onSelectLocation: (location: string) => void;
}

export function RightRail({ selectedLocation, onSelectLocation }: RightRailProps) {
  return (
    <aside aria-label="Koppa Taluk Quick Briefs and Market Rates" className="space-y-6">
      {/* Town / Hobli Quick Filter */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F274A]">
            Koppa Hubs
          </h2>
          {selectedLocation !== 'All' && (
            <button
              type="button"
              onClick={() => onSelectLocation('All')}
              className="text-xs font-semibold text-[#0F274A] hover:underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['All', ...KOPPA_LOCATIONS].map((loc) => {
            const active = selectedLocation === loc;
            return (
              <button
                key={loc}
                type="button"
                onClick={() => onSelectLocation(loc)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#0F274A] text-white border-[#0F274A]'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                {loc === 'All' ? 'All Towns' : loc}
              </button>
            );
          })}
        </div>
      </section>

      {/* Fast-Scan Local Briefs */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F274A] mb-3">
          Koppa Quick Briefs
        </h2>
        <div className="divide-y divide-slate-200">
          {KOPPA_BRIEFS.map((brief) => (
            <div key={brief.id} className="py-3 first:pt-1 last:pb-0">
              <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 mb-1">
                <span className="text-[#0F274A] font-semibold">{brief.area}</span>
                <span aria-hidden="true">·</span>
                <span>{brief.timeLabel}</span>
              </div>
              <p className="font-kannada text-sm text-slate-800 leading-relaxed">
                {brief.textKannada}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Koppa APMC / Estate Market Reference Rates */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F274A]">
            Local Market Rates
          </h2>
          <span className="text-[11px] text-slate-500">₹ / Quintal</span>
        </div>

        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-2 px-3">Crop</th>
                <th className="py-2 px-3 text-right">Rate</th>
                <th className="py-2 px-3 text-right">Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {KOPPA_MARKET_RATES.map((rate) => {
                const isUp = rate.change >= 0;
                return (
                  <tr key={rate.commodity}>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-900">{rate.commodity}</div>
                      <div className="text-[11px] text-slate-500">{rate.variety}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-900 tabular-nums">
                      ₹{rate.pricePerQuintal.toLocaleString('en-IN')}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-medium tabular-nums ${
                        isUp ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {isUp ? `+${rate.change}` : rate.change}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </aside>
  );
}
