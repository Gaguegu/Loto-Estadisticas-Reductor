import { useState, useEffect, useCallback } from 'react';
import { CURRENT_APP_VERSION } from '../config/version';

export interface GitHubCommitInfo {
  sha: string;
  message: string;
  date: string;
  author: string;
  url: string;
}

export function useAppUpdate() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string>('');
  const [updateSource, setUpdateSource] = useState<'sw' | 'version' | 'github' | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(() => {
    const saved = localStorage.getItem('loto_last_update_check');
    return saved ? new Date(saved) : null;
  });
  const [latestCommit, setLatestCommit] = useState<GitHubCommitInfo | null>(null);

  // GitHub repository configuration (e.g. "owner/Loto-Estadisticas-Reductor")
  const [githubRepo, setGithubRepoState] = useState<string>(() => {
    const saved = localStorage.getItem('loto_github_repo');
    // Default to the repo name or previously saved
    return saved || 'ansama/Loto-Estadisticas-Reductor';
  });

  const setGithubRepo = (repo: string) => {
    const cleaned = repo.trim();
    setGithubRepoState(cleaned);
    localStorage.setItem('loto_github_repo', cleaned);
  };

  // Helper to get relative base path for assets like version.json
  const getVersionJsonUrl = () => {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const normalized = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    return `${normalized}version.json?_t=${Date.now()}`;
  };

  // 1. Service Worker update listener
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let refreshing = false;
    // When the controller changes (new service worker activated), reload
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    navigator.serviceWorker.getRegistration().then((registration) => {
      if (!registration) return;

      // If there's already a waiting worker
      if (registration.waiting) {
        setHasUpdate(true);
        setUpdateSource('sw');
        setUpdateMessage('Hay una nueva versión de la aplicación lista para instalar.');
      }

      // If an update is discovered
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setHasUpdate(true);
            setUpdateSource('sw');
            setUpdateMessage('Se han descargado nuevos archivos. Actualiza para ver los cambios.');
          }
        });
      });
    });
  }, []);

  // 2. Function to check for updates from all sources
  const checkForUpdates = useCallback(async (isManual: boolean = false): Promise<{
    hasUpdate: boolean;
    message: string;
    commit?: GitHubCommitInfo;
  }> => {
    setIsChecking(true);
    const now = new Date();
    setLastChecked(now);
    localStorage.setItem('loto_last_update_check', now.toISOString());

    let foundUpdate = false;
    let foundMsg = '';
    let foundCommit: GitHubCommitInfo | undefined;

    try {
      // A) Check Service Worker
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            await registration.update();
            if (registration.waiting) {
              foundUpdate = true;
              foundMsg = 'Nueva versión preparada por el Service Worker.';
              setUpdateSource('sw');
            }
          }
        } catch {
          // SW update error (offline or unprivileged)
        }
      }

      // B) Check remote version.json
      if (!foundUpdate) {
        try {
          const res = await fetch(getVersionJsonUrl(), {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
          });

          if (res.ok) {
            const data = await res.json();
            if (data.buildTime && data.buildTime > CURRENT_APP_VERSION.buildTime) {
              foundUpdate = true;
              foundMsg = `Nueva versión disponible (${data.version || 'reciente'}).`;
              setUpdateSource('version');
            }
          }
        } catch {
          // fetch error ignored
        }
      }

      // C) Check GitHub API if repository is configured with owner/repo format
      const trimmedRepo = githubRepo.trim();
      if (!foundUpdate && trimmedRepo && trimmedRepo.includes('/')) {
        try {
          const gitRes = await fetch(
            `https://api.github.com/repos/${trimmedRepo}/commits?per_page=1&_t=${Date.now()}`,
            {
              headers: {
                Accept: 'application/vnd.github.v3+json',
              },
            }
          );

          if (gitRes.ok) {
            const commits = await gitRes.json();
            if (Array.isArray(commits) && commits.length > 0) {
              const latest = commits[0];
              const latestSha = latest.sha;
              const savedSha = localStorage.getItem('loto_last_commit_sha');

              const commitData: GitHubCommitInfo = {
                sha: latestSha.substring(0, 7),
                message: latest.commit?.message?.split('\n')[0] || 'Actualización de código',
                date: new Date(latest.commit?.author?.date || Date.now()).toLocaleString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                author: latest.commit?.author?.name || 'GitHub',
                url: latest.html_url || `https://github.com/${trimmedRepo}`,
              };

              setLatestCommit(commitData);
              foundCommit = commitData;

              // If savedSha exists and differs from latestSha, we found a real new GitHub commit!
              if (savedSha && savedSha !== latestSha) {
                foundUpdate = true;
                foundMsg = `Nuevo commit en GitHub: "${commitData.message}"`;
                setUpdateSource('github');
              } else if (!savedSha) {
                // Initialize current SHA so future pushes will trigger
                localStorage.setItem('loto_last_commit_sha', latestSha);
              }
            }
          }
        } catch {
          // GitHub API rate-limiting or network error
        }
      }
    } finally {
      setIsChecking(false);
    }

    if (foundUpdate) {
      setHasUpdate(true);
      setUpdateMessage(foundMsg);
      return { hasUpdate: true, message: foundMsg, commit: foundCommit };
    } else {
      if (isManual) {
        return {
          hasUpdate: false,
          message: 'La aplicación está totalmente actualizada. No hay cambios pendientes.',
        };
      }
      return { hasUpdate: false, message: '' };
    }
  }, [githubRepo]);

  // 3. Auto-check on initial load and on tab focus
  useEffect(() => {
    // Initial check on mount
    const timer = setTimeout(() => {
      checkForUpdates(false);
    }, 2500);

    // Periodic check every 15 minutes
    const interval = setInterval(() => {
      checkForUpdates(false);
    }, 15 * 60 * 1000);

    // Check when user returns to the tab
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [checkForUpdates]);

  // 4. Function to apply update (skip waiting, clear caches, hard reload)
  const applyUpdate = async () => {
    setIsChecking(true);

    try {
      // 1. Tell Service Worker to activate the waiting one
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }

      // 2. Clear caches storage
      if ('caches' in window) {
        try {
          const cacheKeys = await window.caches.keys();
          await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
        } catch {
          // ignore cache clearing failure
        }
      }

      // 3. Store latest commit SHA if present
      if (latestCommit?.sha) {
        localStorage.setItem('loto_last_commit_sha', latestCommit.sha);
      }

      // 4. Small delay to let message propagate, then hard reload
      setTimeout(() => {
        // Append query param to bypass browser cache
        const url = new URL(window.location.href);
        url.searchParams.set('_v', Date.now().toString());
        window.location.href = url.toString();
      }, 300);
    } catch {
      window.location.reload();
    }
  };

  const dismissNotification = () => {
    setHasUpdate(false);
  };

  return {
    hasUpdate,
    updateMessage,
    updateSource,
    isChecking,
    lastChecked,
    latestCommit,
    githubRepo,
    setGithubRepo,
    checkForUpdates,
    applyUpdate,
    dismissNotification,
    currentVersion: CURRENT_APP_VERSION,
  };
}
