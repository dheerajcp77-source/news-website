import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { NEWS_CATEGORIES } from '../data/newsData';
import type { FilterCategory, NewsArticle } from '../types/news';
import { AdminArticleModal, type AdminArticlePayload } from './AdminArticleModal';
import { CoffeeCupLogo } from './CoffeeCupLogo';

interface AdminPanelProps {
  articles: NewsArticle[];
  onArticlesUpdated: (next: NewsArticle[]) => void;
  onNavigateHome: () => void;
}

type AuthScreenMode = 'login' | 'forgot-request' | 'forgot-reset';
type AdminTab = 'articles' | 'security';

const TOKEN_STORAGE_KEY = 'coffeenadu_admin_token';

export function AdminPanel({
  articles,
  onArticlesUpdated,
  onNavigateHome,
}: AdminPanelProps) {
  const [token, setToken] = useState<string>(() => {
    try {
      return sessionStorage.getItem(TOKEN_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [checkingSession, setCheckingSession] = useState<boolean>(Boolean(token));

  // Login & Forgot password state
  const [authMode, setAuthMode] = useState<AuthScreenMode>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Forgot password fields
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Dashboard state
  const [activeTab, setActiveTab] = useState<AdminTab>('articles');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [isSavingArticle, setIsSavingArticle] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [dashboardFeedback, setDashboardFeedback] = useState('');
  const [dashboardError, setDashboardError] = useState('');

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [securityMessage, setSecurityMessage] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setCheckingSession(false);
      return;
    }

    let cancelled = false;
    fetch('/api/admin/session', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Session expired');
        return (await res.json()) as { authenticated: boolean; email: string };
      })
      .then((data) => {
        if (!cancelled) {
          setAdminEmail(data.email);
          setCheckingSession(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          try {
            sessionStorage.removeItem(TOKEN_STORAGE_KEY);
          } catch {
            // Ignore storage errors
          }
          setToken('');
          setAdminEmail('');
          setCheckingSession(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return articles.filter((item) => {
      if (categoryFilter !== 'All' && item.category !== categoryFilter) {
        return false;
      }
      if (q) {
        const hay = `${item.titleKannada} ${item.summaryKannada} ${item.location} ${item.category} ${item.reporter}`.toLowerCase();
        return hay.includes(q);
      }
      return true;
    });
  }, [articles, searchQuery, categoryFilter]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setAuthSubmitting(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });
      const data = (await res.json()) as { token?: string; email?: string; error?: string };
      if (!res.ok || !data.token) {
        throw new Error(data.error || 'Invalid email or password.');
      }
      try {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      } catch {
        // Ignore storage errors
      }
      setToken(data.token);
      setAdminEmail(data.email || loginEmail.trim());
      setLoginPassword('');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleRequestForgotCode = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setAuthSubmitting(true);
    try {
      const res = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Could not process password reset request.');
      }
      setAuthSuccess(
        data.message ||
          'Verification code issued. Enter the 6-digit code or your Recovery Key below.'
      );
      setAuthMode('forgot-reset');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Request failed.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (resetNewPassword.length < 6) {
      setAuthError('New password must be at least 6 characters.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setAuthError('New password and confirmation do not match.');
      return;
    }

    setAuthSubmitting(true);
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          codeOrRecoveryKey: resetCode.trim(),
          newPassword: resetNewPassword,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Password reset failed.');
      }
      setLoginEmail(forgotEmail.trim());
      setResetCode('');
      setResetNewPassword('');
      setResetConfirmPassword('');
      setAuthMode('login');
      setAuthSuccess(data.message || 'Password updated. Sign in with your new password.');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Password reset failed.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    setToken('');
    setAdminEmail('');
    setDashboardFeedback('');
    setDashboardError('');
  };

  const handleSaveArticle = async (payload: AdminArticlePayload) => {
    setIsSavingArticle(true);
    setDashboardError('');
    setDashboardFeedback('');
    try {
      const endpoint = editingArticle
        ? `/api/admin/articles/${encodeURIComponent(editingArticle.id)}`
        : '/api/admin/articles';
      const method = editingArticle ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { articles?: NewsArticle[]; error?: string };
      if (res.status === 401) {
        handleLogout();
        throw new Error('Your admin session expired. Please sign in again.');
      }
      if (!res.ok || !data.articles) {
        throw new Error(data.error || 'Failed to save article.');
      }
      onArticlesUpdated(data.articles);
      setModalOpen(false);
      setEditingArticle(null);
      setDashboardFeedback(
        editingArticle ? 'Article updated and published.' : 'New article published to live feed.'
      );
    } finally {
      setIsSavingArticle(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    setDashboardError('');
    setDashboardFeedback('');
    try {
      const res = await fetch(`/api/admin/articles/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { articles?: NewsArticle[]; error?: string };
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (!res.ok || !data.articles) {
        throw new Error(data.error || 'Unable to delete article.');
      }
      onArticlesUpdated(data.articles);
      setConfirmDeleteId(null);
      setDashboardFeedback('Article deleted from feed.');
    } catch (err) {
      setDashboardError(err instanceof Error ? err.message : 'Unable to delete article.');
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setSecurityError('');
    setSecurityMessage('');

    if (newPassword.length < 6) {
      setSecurityError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setSecurityError('New password and confirmation do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Unable to update password.');
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setSecurityMessage(data.message || 'Password updated successfully.');
    } catch (err) {
      setSecurityError(err instanceof Error ? err.message : 'Password update failed.');
    } finally {
      setChangingPassword(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#FBFBF9] flex items-center justify-center p-4">
        <p className="text-sm font-medium text-stone-600">Verifying admin session...</p>
      </div>
    );
  }

  // Unauthenticated /admin login + forgot password screen
  if (!token || !adminEmail) {
    return (
      <div className="min-h-screen bg-[#FBFBF9] flex flex-col">
        <header className="bg-white border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
            <button
              type="button"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 font-masthead text-xl font-extrabold tracking-tight text-[#0F274A] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <CoffeeCupLogo className="w-7 h-7 shrink-0" />
              <span>Coffeenadu News</span>
            </button>
            <button
              type="button"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-700 hover:text-emerald-900 cursor-pointer whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Back to Public Site</span>
            </button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md bg-white border border-stone-200 rounded-lg p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2.5 mb-2">
              <Lock className="w-4 h-4 text-emerald-900" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-900">
                Editorial Access
              </span>
            </div>

            {authMode === 'login' && (
              <>
                <h1 className="text-2xl font-bold text-stone-950 mb-1">Admin Sign In</h1>
                <p className="text-sm text-stone-600 mb-6">
                  Sign in to add, edit, or delete Koppa Taluk news updates.
                </p>

                {authError && (
                  <div
                    role="alert"
                    className="mb-4 px-3.5 py-2.5 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-md"
                  >
                    {authError}
                  </div>
                )}

                {authSuccess && (
                  <div
                    role="status"
                    className="mb-4 px-3.5 py-2.5 text-xs font-medium text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-md"
                  >
                    {authSuccess}
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label
                      htmlFor="admin-login-email"
                      className="block text-xs font-semibold text-stone-700 mb-1.5"
                    >
                      Admin Email
                    </label>
                    <input
                      id="admin-login-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3 py-2.5 text-sm bg-white border border-stone-300 rounded-md text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-emerald-800 min-h-[44px]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="admin-login-password"
                        className="block text-xs font-semibold text-stone-700"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('forgot-request');
                          setForgotEmail(loginEmail);
                          setAuthError('');
                          setAuthSuccess('');
                        }}
                        className="text-xs font-semibold text-emerald-900 hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        id="admin-login-password"
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full pl-3 pr-10 py-2.5 text-sm bg-white border border-stone-300 rounded-md text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-emerald-800 min-h-[44px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword((prev) => !prev)}
                        aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-stone-500 hover:text-stone-800 cursor-pointer"
                      >
                        {showLoginPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authSubmitting}
                    className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-emerald-900 hover:bg-emerald-800 disabled:opacity-60 rounded-md transition-colors cursor-pointer min-h-[44px]"
                  >
                    {authSubmitting ? 'Signing in...' : 'Sign In to Admin Panel'}
                  </button>
                </form>
              </>
            )}

            {authMode === 'forgot-request' && (
              <>
                <h1 className="text-2xl font-bold text-stone-950 mb-1">Forgot Password</h1>
                <p className="text-sm text-stone-600 mb-6">
                  Enter your registered admin email to issue a 6-digit reset code or recover using
                  your Admin Recovery Key.
                </p>

                {authError && (
                  <div
                    role="alert"
                    className="mb-4 px-3.5 py-2.5 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-md"
                  >
                    {authError}
                  </div>
                )}

                <form onSubmit={handleRequestForgotCode} className="space-y-4">
                  <div>
                    <label
                      htmlFor="forgot-email"
                      className="block text-xs font-semibold text-stone-700 mb-1.5"
                    >
                      Registered Admin Email
                    </label>
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3 py-2.5 text-sm bg-white border border-stone-300 rounded-md text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-emerald-800 min-h-[44px]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authSubmitting}
                    className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-emerald-900 hover:bg-emerald-800 disabled:opacity-60 rounded-md transition-colors cursor-pointer min-h-[44px]"
                  >
                    {authSubmitting ? 'Checking account...' : 'Send Reset Code'}
                  </button>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setAuthError('');
                      }}
                      className="font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot-reset');
                        setAuthError('');
                      }}
                      className="font-semibold text-emerald-900 hover:underline cursor-pointer"
                    >
                      Already have recovery key?
                    </button>
                  </div>
                </form>
              </>
            )}

            {authMode === 'forgot-reset' && (
              <>
                <h1 className="text-2xl font-bold text-stone-950 mb-1">Reset Password</h1>
                <p className="text-sm text-stone-600 mb-5">
                  Verify with the 6-digit code from the server log or your Admin Recovery Key.
                </p>

                {authError && (
                  <div
                    role="alert"
                    className="mb-4 px-3.5 py-2.5 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-md"
                  >
                    {authError}
                  </div>
                )}

                {authSuccess && (
                  <div
                    role="status"
                    className="mb-4 px-3.5 py-2.5 text-xs font-medium text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-md"
                  >
                    {authSuccess}
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label
                      htmlFor="reset-email"
                      className="block text-xs font-semibold text-stone-700 mb-1.5"
                    >
                      Admin Email
                    </label>
                    <input
                      id="reset-email"
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-md text-stone-900 focus:outline-none focus:border-emerald-800 min-h-[42px]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reset-code"
                      className="block text-xs font-semibold text-stone-700 mb-1.5"
                    >
                      6-Digit Reset Code or Recovery Key
                    </label>
                    <input
                      id="reset-code"
                      type="text"
                      required
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="Enter code or recovery key"
                      className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-md text-stone-900 focus:outline-none focus:border-emerald-800 min-h-[42px]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reset-new-password"
                      className="block text-xs font-semibold text-stone-700 mb-1.5"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        id="reset-new-password"
                        type={showResetPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full pl-3 pr-10 py-2 text-sm bg-white border border-stone-300 rounded-md text-stone-900 focus:outline-none focus:border-emerald-800 min-h-[42px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetPassword((prev) => !prev)}
                        aria-label={showResetPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-500 hover:text-stone-800 cursor-pointer"
                      >
                        {showResetPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="reset-confirm-password"
                      className="block text-xs font-semibold text-stone-700 mb-1.5"
                    >
                      Confirm New Password
                    </label>
                    <input
                      id="reset-confirm-password"
                      type={showResetPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-md text-stone-900 focus:outline-none focus:border-emerald-800 min-h-[42px]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authSubmitting}
                    className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-emerald-900 hover:bg-emerald-800 disabled:opacity-60 rounded-md transition-colors cursor-pointer min-h-[44px]"
                  >
                    {authSubmitting ? 'Resetting...' : 'Reset Password'}
                  </button>

                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setAuthError('');
                        setAuthSuccess('');
                      }}
                      className="text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Authenticated /admin management dashboard
  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBF9] text-stone-900">
      {/* 3-Zone Top Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => setActiveTab('articles')}
            className="inline-flex items-center gap-2 font-masthead text-xl sm:text-2xl font-extrabold tracking-tight text-[#0F274A] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <CoffeeCupLogo className="w-7 h-7 shrink-0" />
            <span>Coffeenadu Admin</span>
          </button>

          <nav aria-label="Admin sections" className="hidden md:flex items-center gap-6">
            <button
              type="button"
              onClick={() => setActiveTab('articles')}
              className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'articles'
                  ? 'border-emerald-800 text-stone-950'
                  : 'border-transparent text-stone-600 hover:text-stone-950'
              }`}
            >
              Manage News
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'security'
                  ? 'border-emerald-800 text-stone-950'
                  : 'border-transparent text-stone-600 hover:text-stone-950'
              }`}
            >
              Account Security
            </button>
            <button
              type="button"
              onClick={onNavigateHome}
              className="text-sm font-medium text-stone-600 hover:text-stone-950 whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent cursor-pointer"
            >
              View Public Site
            </button>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px]"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Tab Strip */}
      <div className="md:hidden bg-white border-b border-stone-200 px-4 py-2 flex items-center gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('articles')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'articles' ? 'bg-emerald-900 text-white' : 'bg-stone-100 text-stone-700'
          }`}
        >
          Manage News
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'security' ? 'bg-emerald-900 text-white' : 'bg-stone-100 text-stone-700'
          }`}
        >
          Account Security
        </button>
        <button
          type="button"
          onClick={onNavigateHome}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-stone-100 text-stone-700 whitespace-nowrap shrink-0"
        >
          View Public Site
        </button>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'articles' ? (
          <div className="space-y-6">
            {/* Header & Add Action */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-stone-200">
              <div>
                <h1 className="text-2xl font-bold text-stone-950">Koppa Taluk News Desk</h1>
                <p className="text-xs text-stone-500 mt-1">
                  Signed in as <span className="font-semibold text-stone-800">{adminEmail}</span> ·{' '}
                  <span className="tabular-nums">{articles.length}</span> published articles
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingArticle(null);
                  setModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 min-h-[44px]"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Add News</span>
              </button>
            </div>

            {dashboardFeedback && (
              <div
                role="status"
                className="px-4 py-3 text-xs sm:text-sm font-medium text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-md"
              >
                {dashboardFeedback}
              </div>
            )}

            {dashboardError && (
              <div
                role="alert"
                className="px-4 py-3 text-xs sm:text-sm font-medium text-red-800 bg-red-50 border border-red-200 rounded-md"
              >
                {dashboardError}
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1">
                <Search
                  className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles by Kannada headline, town, or reporter..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-stone-200 rounded-md text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-emerald-800 min-h-[40px]"
                />
              </div>

              <select
                aria-label="Filter by category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as FilterCategory)}
                className="px-3 py-2 text-sm bg-white border border-stone-200 rounded-md text-stone-800 focus:outline-none focus:border-emerald-800 min-h-[40px]"
              >
                <option value="All">All Categories</option>
                {NEWS_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Articles Management List */}
            <div className="bg-white border border-stone-200 rounded-md divide-y divide-stone-200">
              {filteredArticles.length === 0 ? (
                <div className="p-8 text-center text-sm text-stone-500">
                  No articles match your current filter.
                </div>
              ) : (
                filteredArticles.map((article) => {
                  const isConfirming = confirmDeleteId === article.id;
                  return (
                    <div
                      key={article.id}
                      className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                          <span className="font-semibold text-emerald-900 uppercase tracking-wider">
                            {article.category}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{article.location}</span>
                          <span aria-hidden="true">·</span>
                          <span>{article.publishedDate}</span>
                          <span aria-hidden="true">·</span>
                          <span>{article.reporter}</span>
                          {article.isFeatured && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-semibold text-amber-800">Lead Story</span>
                            </>
                          )}
                        </div>

                        <h2 className="font-kannada text-base sm:text-lg font-bold text-stone-950 leading-snug">
                          {article.titleKannada}
                        </h2>
                        <p className="font-kannada text-xs sm:text-sm text-stone-600 line-clamp-1">
                          {article.summaryKannada}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingArticle(article);
                            setModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors cursor-pointer min-h-[40px]"
                        >
                          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Edit</span>
                        </button>

                        {isConfirming ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDeleteArticle(article.id)}
                              className="px-3 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-md transition-colors cursor-pointer min-h-[40px]"
                            >
                              Confirm Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-3 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors cursor-pointer min-h-[40px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(article.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors cursor-pointer min-h-[40px]"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* Account & Security Tab */
          <div className="max-w-lg bg-white border border-stone-200 rounded-lg p-6 sm:p-8 space-y-6">
            <div>
              <h1 className="text-xl font-bold text-stone-950">Account Security</h1>
              <p className="text-xs text-stone-500 mt-1">
                Admin Account: <strong className="text-stone-800">{adminEmail}</strong>
              </p>
            </div>

            {securityMessage && (
              <div
                role="status"
                className="px-3.5 py-2.5 text-xs font-medium text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-md"
              >
                {securityMessage}
              </div>
            )}

            {securityError && (
              <div
                role="alert"
                className="px-3.5 py-2.5 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-md"
              >
                {securityError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label
                  htmlFor="sec-current"
                  className="block text-xs font-semibold text-stone-700 mb-1.5"
                >
                  Current Password
                </label>
                <input
                  id="sec-current"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-md text-stone-900 focus:outline-none focus:border-emerald-800 min-h-[40px]"
                />
              </div>

              <div>
                <label
                  htmlFor="sec-new"
                  className="block text-xs font-semibold text-stone-700 mb-1.5"
                >
                  New Password
                </label>
                <input
                  id="sec-new"
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-md text-stone-900 focus:outline-none focus:border-emerald-800 min-h-[40px]"
                />
              </div>

              <div>
                <label
                  htmlFor="sec-confirm"
                  className="block text-xs font-semibold text-stone-700 mb-1.5"
                >
                  Confirm New Password
                </label>
                <input
                  id="sec-confirm"
                  type="password"
                  required
                  minLength={6}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-md text-stone-900 focus:outline-none focus:border-emerald-800 min-h-[40px]"
                />
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-900 hover:bg-emerald-800 disabled:opacity-60 rounded-md transition-colors cursor-pointer min-h-[40px]"
              >
                {changingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}
      </main>

      <AdminArticleModal
        isOpen={modalOpen}
        token={token}
        editingArticle={editingArticle}
        isSaving={isSavingArticle}
        onClose={() => {
          setModalOpen(false);
          setEditingArticle(null);
        }}
        onSubmit={handleSaveArticle}
      />
    </div>
  );
}
