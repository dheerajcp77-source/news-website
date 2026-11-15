import {
  CloudSun,
  GraduationCap,
  Landmark,
  MapPin,
  Newspaper,
  Search,
  Sprout,
  Theater,
  Trophy,
  X,
} from 'lucide-react';
import koppaLandscapeImg from '../assets/images/koppa_town_landscape_1794709366123.jpg';
import { KOPPA_LOCATIONS, NEWS_CATEGORIES } from '../data/newsData';
import type { FilterCategory, NewsCategory } from '../types/news';

interface CategoryBarProps {
  activeCategory: FilterCategory;
  onSelectCategory: (category: FilterCategory) => void;
  selectedLocation: string;
  onSelectLocation: (location: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const ALL_TABS: FilterCategory[] = ['All', ...NEWS_CATEGORIES];

function renderCategoryIcon(category: FilterCategory) {
  switch (category) {
    case 'All':
      return <Newspaper className="w-4 h-4 shrink-0" aria-hidden="true" />;
    case 'Local':
      return <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />;
    case 'Agriculture':
      return <Sprout className="w-4 h-4 shrink-0" aria-hidden="true" />;
    case 'Civic & Roads':
      return <Landmark className="w-4 h-4 shrink-0" aria-hidden="true" />;
    case 'Education':
      return <GraduationCap className="w-4 h-4 shrink-0" aria-hidden="true" />;
    case 'Culture':
      return <Theater className="w-4 h-4 shrink-0" aria-hidden="true" />;
    case 'Sports':
      return <Trophy className="w-4 h-4 shrink-0" aria-hidden="true" />;
  }
}

export function getCategoryLabel(category: FilterCategory): string {
  if (category === 'All') return 'All News';
  return category;
}

export function getCategoryShortIcon(category: NewsCategory) {
  return renderCategoryIcon(category);
}

export function CategoryBar({
  activeCategory,
  onSelectCategory,
  selectedLocation,
  onSelectLocation,
  searchQuery,
  onSearchChange,
}: CategoryBarProps) {
  return (
    <div className="bg-[#F2F5F8]">
      {/* Scenic Curved Koppa Hero Banner */}
      <section aria-label="Koppa Taluk overview" className="relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto">
          <div className="relative min-h-[175px] sm:min-h-[205px] rounded-b-[28px] overflow-hidden border-b border-slate-200/80 bg-white">
            <img
              src={koppaLandscapeImg}
              alt="Koppa Taluk hills and morning road"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-[#F8FAFC] via-[#F8FAFC]/90 to-[#F8FAFC]/20 sm:via-[#F8FAFC]/85"
              aria-hidden="true"
            />

            <div className="relative z-10 px-5 sm:px-8 lg:px-10 py-6 sm:py-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-red-600 shrink-0" aria-hidden="true" />
                  <label htmlFor="hero-location-select" className="sr-only">
                    Select Koppa Taluk town or hobli
                  </label>
                  <select
                    id="hero-location-select"
                    value={selectedLocation}
                    onChange={(e) => onSelectLocation(e.target.value)}
                    className="bg-transparent text-2xl sm:text-3xl font-extrabold text-[#0F274A] tracking-tight focus:outline-none cursor-pointer pr-2"
                  >
                    <option value="All">Koppa Taluk</option>
                    {KOPPA_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="text-sm sm:text-base font-medium text-slate-700">
                  Local Kannada news from Koppa, Jayapura, Hariharapura &amp; Malnad
                </p>

                <div className="inline-flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-800 bg-white/95 border border-slate-200 px-3 py-1.5 rounded-lg">
                  <CloudSun className="w-4 h-4 text-amber-500 shrink-0" aria-hidden="true" />
                  <span className="tabular-nums font-semibold">26°C</span>
                  <span aria-hidden="true">·</span>
                  <span>Misty &amp; Partly Cloudy</span>
                  <span aria-hidden="true" className="hidden sm:inline">·</span>
                  <span className="hidden sm:inline text-slate-600">14 Nov 2026</span>
                </div>
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:w-72">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search town or Kannada news..."
                  aria-label="Search Koppa Taluk news"
                  className="w-full pl-9 pr-9 py-2.5 text-sm bg-white/95 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0F274A] shadow-xs min-h-[42px]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Horizontal Category Filter Buttons */}
      <section
        aria-label="News categories"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2"
      >
        <div
          role="tablist"
          aria-label="News categories"
          className="flex items-center gap-2 overflow-x-auto pb-2"
        >
          {ALL_TABS.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => onSelectCategory(category)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[42px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F274A] ${
                  isActive
                    ? 'bg-[#0F274A] text-white border-[#0F274A] shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:text-slate-950'
                }`}
              >
                {renderCategoryIcon(category)}
                <span>{getCategoryLabel(category)}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
