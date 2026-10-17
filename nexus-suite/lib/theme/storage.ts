/**
 * Shared theme storage constants + the pre-paint script.
 *
 * Kept in a plain (non-client) module so the server root layout can import the
 * init script string directly without going through a `'use client'` boundary.
 */

/** Persisted theme state (JSON). */
export const THEME_STORAGE_KEY = 'nexus-ui-theme';
/** Precomputed CSS, read by the pre-paint script to avoid a flash. */
export const THEME_CSS_STORAGE_KEY = 'nexus-ui-theme-css';
/** Id of the injected <style> element. */
export const THEME_STYLE_ID = 'nexus-ui-theme';

/**
 * Inline script injected before paint. It re-applies the last generated theme
 * CSS so the customized theme is present on first render (mirrors how
 * next-themes avoids a flash for light/dark mode).
 */
export const THEME_INIT_SCRIPT = `(function(){try{var c=localStorage.getItem('${THEME_CSS_STORAGE_KEY}');if(!c)return;var s=document.getElementById('${THEME_STYLE_ID}');if(!s){s=document.createElement('style');s.id='${THEME_STYLE_ID}';document.head.appendChild(s);}s.textContent=c;}catch(e){}})();`;
