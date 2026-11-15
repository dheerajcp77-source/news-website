import { useState } from 'react';
import { ArrowLeft, Check, Share2 } from 'lucide-react';
import { resolveArticleImage } from '../data/newsData';
import type { NewsArticle } from '../types/news';
import { NewsImage } from './NewsImage';

interface ArticleDetailViewProps {
  article: NewsArticle;
  relatedArticles: NewsArticle[];
  onBack: () => void;
  onSelectArticle: (article: NewsArticle) => void;
}

export function ArticleDetailView({
  article,
  relatedArticles,
  onBack,
  onSelectArticle,
}: ArticleDetailViewProps) {
  const [copied, setCopied] = useState(false);
  const resolvedImage = resolveArticleImage(article);

  const handleCopyShare = async () => {
    const shareText = `${article.titleKannada} — Coffeenadu News (${article.location})`;
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Top Action Row */}
      <div className="flex items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-700 hover:text-[#0F274A] transition-colors cursor-pointer min-h-[40px] px-2 -ml-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Feed</span>
        </button>

        <button
          type="button"
          onClick={handleCopyShare}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors cursor-pointer min-h-[40px]"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-800" aria-hidden="true" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Share</span>
            </>
          )}
        </button>
      </div>

      {/* Article Body */}
      <article className="py-8 max-w-3xl mx-auto">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-stone-500 mb-4">
          <span className="uppercase tracking-wider text-[#0F274A] font-semibold">
            {article.category}
          </span>
          <span aria-hidden="true">·</span>
          <span>{article.location}</span>
          <span aria-hidden="true">·</span>
          <span>{article.publishedDate}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{article.publishedTime}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{article.readTimeMinutes} min read</span>
        </div>

        <h1 className="font-kannada text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-950 leading-snug text-balance mb-5">
          {article.titleKannada}
        </h1>

        <p className="font-kannada text-base sm:text-lg text-stone-700 leading-relaxed mb-6 pb-6 border-b border-stone-200">
          {article.summaryKannada}
        </p>

        <div className="flex items-center justify-between text-xs text-stone-500 mb-6">
          <span>
            Reported by <strong className="font-semibold text-stone-800">{article.reporter}</strong>
          </span>
          <span>Koppa Taluk Desk</span>
        </div>

        {resolvedImage && (
          <figure className="mb-8">
            <NewsImage
              src={resolvedImage}
              alt={article.titleKannada}
              aspectClass="aspect-[16/9]"
              className="rounded-md border border-stone-200"
            />
            {article.imageCaption && (
              <figcaption className="font-kannada text-xs text-stone-500 mt-2.5 leading-relaxed">
                {article.imageCaption}
              </figcaption>
            )}
          </figure>
        )}

        <div className="space-y-5 max-w-prose">
          {article.bodyKannada.map((paragraph, index) => (
            <p
              key={index}
              className="font-kannada text-base sm:text-[17px] text-stone-800 leading-[1.85]"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </article>

      {/* Related Stories */}
      {relatedArticles.length > 0 && (
        <section
          aria-label="More local news"
          className="mt-10 pt-8 border-t border-stone-200 max-w-3xl mx-auto"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500 mb-5">
            More from {article.category}
          </h2>
          <div className="divide-y divide-stone-200 border-t border-b border-stone-200">
            {relatedArticles.map((related) => (
              <button
                key={related.id}
                type="button"
                onClick={() => onSelectArticle(related)}
                className="w-full text-left py-4 group flex flex-col gap-1.5 hover:bg-stone-50/80 transition-colors cursor-pointer px-2 -mx-2 rounded-sm"
              >
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <span>{related.location}</span>
                  <span aria-hidden="true">·</span>
                  <span>{related.publishedDate}</span>
                </div>
                <h3 className="font-kannada text-base sm:text-lg font-semibold text-stone-900 group-hover:text-emerald-900 transition-colors leading-snug">
                  {related.titleKannada}
                </h3>
              </button>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
