import type { FilterCategory } from '../types/news';
import { CoffeeCupLogo } from './CoffeeCupLogo';

interface HeaderProps {
  activeCategory: FilterCategory;
  isBusTimingsView?: boolean;
  onSelectCategory: (category: FilterCategory) => void;
  onResetHome: () => void;
  onJumpToBusTimings: () => void;
}

const HEADER_NAV_ITEMS: { label: string; category: FilterCategory }[] = [
  { label: 'All News', category: 'All' },
  { label: 'Local', category: 'Local' },
  { label: 'Agriculture', category: 'Agriculture' },
  { label: 'Civic', category: 'Civic & Roads' },
  { label: 'Culture', category: 'Culture' },
];

export function Header({
  activeCategory,
  isBusTimingsView = false,
  onSelectCategory,
  onResetHome,
  onJumpToBusTimings,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line brand wordmark with coffee cup logo */}
        <button
          type="button"
          onClick={onResetHome}
          className="inline-flex items-center gap-2.5 font-masthead text-xl sm:text-2xl font-extrabold tracking-tight text-[#0F274A] hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F274A] rounded-sm"
        >
          <CoffeeCupLogo className="w-8 h-8 shrink-0" />
          <span>Coffeenadu News</span>
        </button>

        {/* Zone 2: 5 concise single-line English navigation links */}
        <nav
          aria-label="Primary categories"
          className="hidden md:flex items-center gap-6"
        >
          {HEADER_NAV_ITEMS.map((item) => {
            const isActive = !isBusTimingsView && activeCategory === item.category;
            return (
              <button
                key={item.category}
                type="button"
                onClick={() => onSelectCategory(item.category)}
                className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F274A] rounded-xs ${
                  isActive
                    ? 'border-[#0F274A] text-[#0F274A] font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-950 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action opening separate Bus Timings section */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onJumpToBusTimings}
            aria-current={isBusTimingsView ? 'page' : undefined}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0F274A] ${
              isBusTimingsView
                ? 'bg-amber-400 text-[#0F274A] hover:bg-amber-300'
                : 'bg-[#0F274A] text-white hover:bg-[#173a6e]'
            }`}
          >
            Bus Timings
          </button>
        </div>
      </div>
    </header>
  );
}
