import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Calendar, ChevronRight, Clock } from 'lucide-react';
import koppaLandscapeImg from './assets/images/koppa_town_landscape_1794709366123.jpg';
import { AdminPanel } from './components/AdminPanel';
import { ArticleDetailView } from './components/ArticleDetailView';
import { BusTimingsSection } from './components/BusTimingsSection';
import { CategoryBar, getCategoryShortIcon } from './components/CategoryBar';
import { CoffeeCupLogo } from './components/CoffeeCupLogo';
import { Header } from './components/Header';
import { NewsImage } from './components/NewsImage';
import { RightRail } from './components/RightRail';
import {
  INITIAL_ARTICLES,
  NEWS_CATEGORIES,
  resolveArticleImage,
} from './data/newsData';
import type { FilterCategory, NewsArticle } from './types/news';

type TimeframeFilter = 'All' | 'Today' | 'Yesterday' | 'This Week';

function isAdminPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return normalized === '/admin' || normalized.startsWith('/admin/');
}

function isBusTimingsPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return normalized === '/bus-timings' || normalized.startsWith('/bus-timings/');
}

function matchesTimeframe(article: NewsArticle, timeframe: TimeframeFilter): boolean {
  if (timeframe === 'All') return true;
  const dateStr = article.publishedDate.trim();
  const todayLabel = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayLabel = yesterday.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  if (timeframe === 'Today') {
    return dateStr === todayLabel || dateStr === '14 Nov 2026';
  }
  if (timeframe === 'Yesterday') {
    return dateStr === yesterdayLabel || dateStr === '13 Nov 2026';
  }
  // This Week
  return true;
}

export default function App() {
  const [pathname, setPathname] = useState<string>(() => window.location.pathname);
  const [articles, setArticles] = useState<NewsArticle[]>(INITIAL_ARTICLES);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/articles')
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as { articles?: NewsArticle[] };
      })
      .then((data) => {
        if (!cancelled && data?.articles && Array.isArray(data.articles)) {
          setArticles(data.articles);
        }
      })
      .catch(() => {
        // Keep initial articles seamlessly if offline
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const navigateTo = (targetPath: string) => {
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
      setPathname(targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return articles.filter((article) => {
      if (activeCategory !== 'All' && article.category !== activeCategory) {
        return false;
      }
      if (selectedLocation !== 'All' && article.location !== selectedLocation) {
        return false;
      }
      if (!matchesTimeframe(article, timeframe)) {
        return false;
      }
      if (q) {
        const haystack = [
          article.titleKannada,
          article.summaryKannada,
          article.category,
          article.location,
          article.reporter,
          ...article.bodyKannada,
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      }
      return true;
    });
  }, [articles, activeCategory, selectedLocation, timeframe, searchQuery]);

  const selectedArticle = useMemo(
    () => articles.find((a) => a.id === selectedArticleId) ?? null,
    [articles, selectedArticleId]
  );

  const relatedArticles = useMemo(() => {
    if (!selectedArticle) return [];
    return articles
      .filter(
        (a) => a.id !== selectedArticle.id && a.category === selectedArticle.category
      )
      .slice(0, 3);
  }, [articles, selectedArticle]);

  const busTimingsActive = isBusTimingsPath(pathname);

  const handleSelectCategory = (category: FilterCategory) => {
    setActiveCategory(category);
    setSelectedArticleId(null);
    if (busTimingsActive) {
      navigateTo('/');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleResetHome = () => {
    setActiveCategory('All');
    setSelectedLocation('All');
    setTimeframe('All');
    setSearchQuery('');
    setSelectedArticleId(null);
    if (busTimingsActive) {
      navigateTo('/');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenArticle = (article: NewsArticle) => {
    setSelectedArticleId(article.id);
    if (busTimingsActive) {
      navigateTo('/');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleJumpToBusTimings = () => {
    setSelectedArticleId(null);
    navigateTo('/bus-timings');
  };

  if (isAdminPath(pathname)) {
    return (
      <AdminPanel
        articles={articles}
        onArticlesUpdated={(next) => setArticles(next)}
        onNavigateHome={() => navigateTo('/')}
      />
    );
  }

  const leadArticle =
    filteredArticles.find((a) => a.isFeatured) ?? filteredArticles[0] ?? null;
  const timelineArticles = leadArticle
    ? filteredArticles.filter((a) => a.id !== leadArticle.id)
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-[#F2F5F8] text-slate-900">
      <Header
        activeCategory={activeCategory}
        isBusTimingsView={busTimingsActive}
        onSelectCategory={handleSelectCategory}
        onResetHome={handleResetHome}
        onJumpToBusTimings={handleJumpToBusTimings}
      />

      {!selectedArticle && !busTimingsActive && (
        <CategoryBar
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
          selectedLocation={selectedLocation}
          onSelectLocation={setSelectedLocation}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      )}

      {busTimingsActive ? (
        <main className="flex-1">
          <BusTimingsSection onBackToNews={handleResetHome} />
        </main>
      ) : selectedArticle ? (
        <div className="flex-1 bg-white">
          <ArticleDetailView
            article={selectedArticle}
            relatedArticles={relatedArticles}
            onBack={() => setSelectedArticleId(null)}
            onSelectArticle={handleOpenArticle}
          />
        </div>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left/Main Timeline Feed (8 cols on desktop, full width on mobile) */}
            <div className="lg:col-span-8">
              {/* Section Heading & Timeframe Filter Row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-2 w-3 h-3 rounded-full border-2 border-amber-400 bg-white shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <h1 className="text-lg sm:text-xl font-extrabold text-[#0F274A] tracking-tight">
                      {activeCategory === 'All'
                        ? 'Koppa Latest Updates'
                        : `${activeCategory} Updates`}
                    </h1>
                    <div
                      className="h-1 w-20 bg-amber-400 rounded-full mt-1"
                      aria-hidden="true"
                    />
                  </div>
                </div>

                {/* Segmented Timeframe Control */}
                <div
                  role="group"
                  aria-label="Filter by timeframe"
                  className="inline-flex items-center bg-white border border-slate-200 rounded-xl p-1 self-start sm:self-auto"
                >
                  {(['All', 'Today', 'Yesterday', 'This Week'] as TimeframeFilter[]).map(
                    (tf) => {
                      const active = timeframe === tf;
                      return (
                        <button
                          key={tf}
                          type="button"
                          onClick={() => setTimeframe(tf)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            active
                              ? 'bg-[#0F274A] text-white'
                              : 'text-slate-600 hover:text-slate-950'
                          }`}
                        >
                          {active && <Calendar className="w-3.5 h-3.5" aria-hidden="true" />}
                          <span>{tf}</span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {filteredArticles.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                  <h2 className="text-base font-bold text-slate-900 mb-1.5">
                    No matching updates found
                  </h2>
                  <p className="text-sm text-slate-600 mb-4">
                    Try clearing your search or switching back to all Koppa Taluk updates.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetHome}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#0F274A] hover:bg-[#173a6e] rounded-lg transition-colors cursor-pointer min-h-[40px]"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="relative pl-6 sm:pl-7">
                  {/* Continuous vertical timeline rail */}
                  <div
                    className="absolute left-[5px] top-0 bottom-4 w-px bg-slate-300"
                    aria-hidden="true"
                  />

                  <div className="space-y-4">
                    {/* Featured Lead Story Banner Card */}
                    {leadArticle && (
                      <div className="relative">
                        <span
                          className="absolute -left-6 sm:-left-7 top-6 w-3 h-3 rounded-full border-2 border-amber-400 bg-white z-10"
                          aria-hidden="true"
                        />
                        <article
                          onClick={() => handleOpenArticle(leadArticle)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleOpenArticle(leadArticle);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          className="group relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm cursor-pointer min-h-[240px] sm:min-h-[270px] flex flex-col justify-between p-5 sm:p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F274A]"
                        >
                          <img
                            src={resolveArticleImage(leadArticle) || koppaLandscapeImg}
                            alt={leadArticle.titleKannada}
                            referrerPolicy="no-referrer"
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                          <div
                            className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/30"
                            aria-hidden="true"
                          />

                          {/* Top row */}
                          <div className="relative z-10 flex items-center justify-between gap-3 text-xs">
                            <span className="font-semibold text-amber-300 tracking-wide">
                              Featured · {leadArticle.location}
                            </span>
                            <span className="inline-flex items-center gap-1 text-slate-200 tabular-nums">
                              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>{leadArticle.publishedDate}</span>
                            </span>
                          </div>

                          {/* Center Kannada Headline & Summary */}
                          <div className="relative z-10 my-4 max-w-xl space-y-2">
                            <h2 className="font-kannada text-xl sm:text-2xl lg:text-[28px] font-bold text-white leading-snug text-balance">
                              {leadArticle.titleKannada}
                            </h2>
                            <p className="font-kannada text-xs sm:text-sm text-slate-200 leading-relaxed line-clamp-2">
                              {leadArticle.summaryKannada}
                            </p>
                          </div>

                          {/* Bottom row */}
                          <div className="relative z-10 flex items-center justify-between gap-3">
                            <span className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-white group-hover:bg-amber-300 rounded-lg transition-colors">
                              <span>Read More</span>
                              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                            </span>

                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white">
                              {getCategoryShortIcon(leadArticle.category)}
                              <span>{leadArticle.category}</span>
                            </span>
                          </div>
                        </article>
                      </div>
                    )}

                    {/* Timeline Horizontal Story Cards */}
                    {timelineArticles.map((article, index) => {
                      const imgSrc = resolveArticleImage(article);
                      const isAccentNode = index % 2 === 1;
                      return (
                        <div key={article.id} className="relative">
                          <span
                            className={`absolute -left-6 sm:-left-7 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 bg-white z-10 ${
                              isAccentNode ? 'border-amber-400' : 'border-[#0F274A]'
                            }`}
                            aria-hidden="true"
                          />

                          <article
                            onClick={() => handleOpenArticle(article)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleOpenArticle(article);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            className="group bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 sm:p-4 shadow-2xs transition-colors flex items-center gap-3.5 sm:gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F274A]"
                          >
                            {/* Left Thumbnail */}
                            <div className="w-24 h-20 sm:w-36 sm:h-24 shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                              {imgSrc ? (
                                <NewsImage
                                  src={imgSrc}
                                  alt={article.titleKannada}
                                  aspectClass="w-full h-full"
                                  className="h-full"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-[#0F274A] bg-slate-100 p-2 text-center">
                                  {getCategoryShortIcon(article.category)}
                                  <span className="text-[10px] font-semibold mt-1 text-slate-600">
                                    {article.category}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Center Content */}
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                                <span className="text-[#0F274A]">{article.category}</span>
                                <span aria-hidden="true">·</span>
                                <span>{article.location}</span>
                              </div>

                              <h3 className="font-kannada text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#0F274A] transition-colors leading-snug line-clamp-2">
                                {article.titleKannada}
                              </h3>

                              <p className="font-kannada text-xs text-slate-600 line-clamp-1">
                                {article.summaryKannada}
                              </p>

                              <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-0.5 tabular-nums">
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" aria-hidden="true" />
                                  <span>{article.publishedDate}</span>
                                </span>
                                <span aria-hidden="true">·</span>
                                <span>{article.publishedTime}</span>
                                <span aria-hidden="true">·</span>
                                <span>{article.readTimeMinutes} min read</span>
                              </div>
                            </div>

                            {/* Right Chevron Affordance */}
                            <div
                              className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 group-hover:bg-[#0F274A] group-hover:text-white transition-colors flex items-center justify-center shrink-0"
                              aria-hidden="true"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </article>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Rail (4 cols on desktop, stacks below on mobile) */}
            <div id="koppa-right-rail" className="lg:col-span-4">
              <RightRail
                selectedLocation={selectedLocation}
                onSelectLocation={(loc) => {
                  setSelectedLocation(loc);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          </div>
        </main>
      )}

      <footer className="border-t border-slate-200 bg-white mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 font-masthead text-lg font-bold text-[#0F274A]">
              <CoffeeCupLogo className="w-6 h-6 shrink-0" />
              <span>Coffeenadu News</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Koppa Taluk, Chikkamagaluru District · English navigation, Kannada reporting
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
            {NEWS_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleSelectCategory(cat)}
                className="hover:text-[#0F274A] transition-colors cursor-pointer whitespace-nowrap"
              >
                {cat}
              </button>
            ))}
            <button
              type="button"
              onClick={handleJumpToBusTimings}
              className="font-semibold text-[#0F274A] hover:underline cursor-pointer whitespace-nowrap"
            >
              Bus Timings
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
