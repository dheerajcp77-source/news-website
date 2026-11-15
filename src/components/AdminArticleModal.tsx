import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { ImagePlus, Trash2, X } from 'lucide-react';
import {
  IMAGE_PRESETS,
  KOPPA_LOCATIONS,
  NEWS_CATEGORIES,
  resolveArticleImage,
} from '../data/newsData';
import type { ImageKey, NewsArticle, NewsCategory } from '../types/news';

export interface AdminArticlePayload {
  titleKannada: string;
  summaryKannada: string;
  bodyKannada: string[];
  category: NewsCategory;
  location: string;
  reporter: string;
  imageKey: ImageKey;
  imageUrl?: string;
  imageCaption?: string;
  isFeatured: boolean;
}

interface AdminArticleModalProps {
  isOpen: boolean;
  token: string;
  editingArticle: NewsArticle | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (payload: AdminArticlePayload) => Promise<void>;
}

function optimizeImageFile(file: File): Promise<{ mimeType: string; base64Data: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image file.'));
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) {
        reject(new Error('Empty image data.'));
        return;
      }

      if (file.type === 'image/gif') {
        resolve({ mimeType: 'image/gif', base64Data: dataUrl });
        return;
      }

      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file.'));
      img.onload = () => {
        const maxWidth = 1280;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const targetWidth = Math.round(img.width * scale);
        const targetHeight = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ mimeType: file.type || 'image/jpeg', base64Data: dataUrl });
          return;
        }
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const optimizedDataUrl = canvas.toDataURL(outputMime, 0.84);
        resolve({ mimeType: outputMime, base64Data: optimizedDataUrl });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export function AdminArticleModal({
  isOpen,
  token,
  editingArticle,
  isSaving,
  onClose,
  onSubmit,
}: AdminArticleModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [titleKannada, setTitleKannada] = useState('');
  const [summaryKannada, setSummaryKannada] = useState('');
  const [bodyKannada, setBodyKannada] = useState('');
  const [category, setCategory] = useState<NewsCategory>('Local');
  const [location, setLocation] = useState<string>('Koppa Town');
  const [reporter, setReporter] = useState('Coffeenadu Desk');
  const [imageKey, setImageKey] = useState<ImageKey>('none');
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (editingArticle) {
      setTitleKannada(editingArticle.titleKannada);
      setSummaryKannada(editingArticle.summaryKannada);
      setBodyKannada(editingArticle.bodyKannada.join('\n\n'));
      setCategory(editingArticle.category);
      setLocation(editingArticle.location);
      setReporter(editingArticle.reporter);
      setImageKey(editingArticle.imageKey || 'none');
      setImageUrl(editingArticle.imageUrl || '');
      setImageCaption(editingArticle.imageCaption || '');
      setIsFeatured(Boolean(editingArticle.isFeatured));
    } else {
      setTitleKannada('');
      setSummaryKannada('');
      setBodyKannada('');
      setCategory('Local');
      setLocation('Koppa Town');
      setReporter('Coffeenadu Desk');
      setImageKey('none');
      setImageUrl('');
      setImageCaption('');
      setIsFeatured(false);
    }
    setErrorMessage('');
  }, [isOpen, editingArticle]);

  if (!isOpen) return null;

  const previewUrl =
    imageUrl ||
    resolveArticleImage({
      id: 'preview',
      titleKannada: '',
      summaryKannada: '',
      bodyKannada: [],
      category,
      location,
      publishedDate: '',
      publishedTime: '',
      readTimeMinutes: 1,
      reporter,
      imageKey,
      imageUrl: imageUrl || undefined,
    });

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please choose an image file (JPG, PNG, WebP, or GIF).');
      return;
    }

    setErrorMessage('');
    setIsUploadingImage(true);
    try {
      const optimized = await optimizeImageFile(file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(optimized),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Image upload failed.');
      }
      setImageUrl(data.url);
      setImageKey('none');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to upload image.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanTitle = titleKannada.trim();
    const cleanSummary = summaryKannada.trim();
    const paragraphs = bodyKannada
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!cleanTitle || !cleanSummary || paragraphs.length === 0) {
      setErrorMessage('Please fill in the Kannada headline, summary, and full report.');
      return;
    }

    setErrorMessage('');
    try {
      await onSubmit({
        titleKannada: cleanTitle,
        summaryKannada: cleanSummary,
        bodyKannada: paragraphs,
        category,
        location,
        reporter: reporter.trim() || 'Coffeenadu Desk',
        imageKey,
        imageUrl: imageUrl.trim(),
        imageCaption: imageCaption.trim() || undefined,
        isFeatured,
      });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to save article.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-article-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl shadow-lg overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 id="admin-article-modal-title" className="text-lg font-bold text-slate-950">
              {editingArticle ? 'Edit News Article' : 'Add News Article'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload a photo from your device and publish Kannada news for Koppa Taluk readers
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {errorMessage && (
            <div
              role="alert"
              className="px-3.5 py-2.5 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-md"
            >
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="admin-category" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Category
              </label>
              <select
                id="admin-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as NewsCategory)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-[#0F274A] min-h-[40px]"
              >
                {NEWS_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="admin-location" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Town / Hobli
              </label>
              <select
                id="admin-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-[#0F274A] min-h-[40px]"
              >
                {KOPPA_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="admin-title" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Headline (Kannada)
            </label>
            <input
              id="admin-title"
              type="text"
              value={titleKannada}
              onChange={(e) => setTitleKannada(e.target.value)}
              placeholder="ಕನ್ನಡದಲ್ಲಿ ಸುದ್ದಿಯ ಶೀರ್ಷಿಕೆ ಬರೆಯಿರಿ..."
              className="w-full px-3 py-2 text-sm font-kannada bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0F274A] min-h-[40px]"
            />
          </div>

          <div>
            <label htmlFor="admin-summary" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Short Summary (Kannada)
            </label>
            <textarea
              id="admin-summary"
              rows={2}
              value={summaryKannada}
              onChange={(e) => setSummaryKannada(e.target.value)}
              placeholder="ಸುದ್ದಿಯ ಸಾರಾಂಶವನ್ನು 1-2 ವಾಕ್ಯಗಳಲ್ಲಿ ಬರೆಯಿರಿ..."
              className="w-full px-3 py-2 text-sm font-kannada bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0F274A]"
            />
          </div>

          <div>
            <label htmlFor="admin-body" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Full Report (Kannada)
            </label>
            <textarea
              id="admin-body"
              rows={5}
              value={bodyKannada}
              onChange={(e) => setBodyKannada(e.target.value)}
              placeholder="ಸಂಪೂರ್ಣ ವರದಿಯನ್ನು ಕನ್ನಡದಲ್ಲಿ ನಮೂದಿಸಿ (Separate paragraphs with a new line)..."
              className="w-full px-3 py-2 text-sm font-kannada bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0F274A]"
            />
          </div>

          {/* System Image Upload Section */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/70 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-800">
                News Photo (System Upload or Preset)
              </span>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="inline-flex items-center gap-1 text-xs font-medium text-red-700 hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Remove Uploaded Photo</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
              <div>
                <input
                  ref={fileInputRef}
                  id="admin-file-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="sr-only"
                />
                <label
                  htmlFor="admin-file-upload"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-xs font-semibold text-[#0F274A] bg-white border border-slate-300 hover:border-[#0F274A] rounded-md cursor-pointer transition-colors min-h-[42px]"
                >
                  <ImagePlus className="w-4 h-4" aria-hidden="true" />
                  <span>{isUploadingImage ? 'Uploading photo...' : 'Upload Image from System'}</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  JPG, PNG, WebP, or GIF from your computer or phone
                </p>
              </div>

              <div>
                <label htmlFor="admin-image-preset" className="sr-only">
                  Or choose preset Koppa photo
                </label>
                <select
                  id="admin-image-preset"
                  value={imageUrl ? 'none' : imageKey}
                  onChange={(e) => {
                    setImageKey(e.target.value as ImageKey);
                    setImageUrl('');
                  }}
                  className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:border-[#0F274A] min-h-[42px]"
                >
                  {IMAGE_PRESETS.map((preset) => (
                    <option key={preset.key} value={preset.key}>
                      Preset: {preset.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Or pick a Koppa Taluk preset image
                </p>
              </div>
            </div>

            {previewUrl && (
              <div className="pt-1">
                <img
                  src={previewUrl}
                  alt="Selected article preview"
                  className="w-full max-h-44 object-cover rounded-md border border-slate-200"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="admin-image-caption" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Photo Caption (Kannada, Optional)
              </label>
              <input
                id="admin-image-caption"
                type="text"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                placeholder="ಚಿತ್ರದ ವಿವರಣೆ..."
                className="w-full px-3 py-2 text-sm font-kannada bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0F274A] min-h-[40px]"
              />
            </div>

            <div>
              <label htmlFor="admin-reporter" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Reporter Name
              </label>
              <input
                id="admin-reporter"
                type="text"
                value={reporter}
                onChange={(e) => setReporter(e.target.value)}
                placeholder="Coffeenadu Desk"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0F274A] min-h-[40px]"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-sm text-slate-800 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-4 h-4 accent-[#0F274A] rounded"
            />
            <span>Pin as Featured Lead Story on the front page</span>
          </label>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isUploadingImage}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer min-h-[40px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isUploadingImage}
              className="px-5 py-2 text-sm font-semibold text-white bg-[#0F274A] hover:bg-[#173a6e] disabled:opacity-60 rounded-md transition-colors cursor-pointer min-h-[40px]"
            >
              {isSaving
                ? 'Saving...'
                : editingArticle
                ? 'Save Changes'
                : 'Publish Story'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
