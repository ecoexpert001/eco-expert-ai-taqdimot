// Language and theme state. The choice is remembered per browser; ?lang=ru / ?theme=light override it.
import en from './lang/en.js';
import uz from './lang/uz.js';
import ru from './lang/ru.js';

export const LANGS = { uz, ru, en };
export const LANG_ORDER = ['uz', 'ru', 'en'];

const params = new URLSearchParams(window.location.search);
const store = {
  get(k) { try { return window.localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { window.localStorage.setItem(k, v); } catch { /* private mode */ } },
};

let lang = [params.get('lang'), store.get('eea.lang')].find((l) => l && LANGS[l]) || 'uz';
let theme = [params.get('theme'), store.get('eea.theme')].find((t) => t === 'light' || t === 'dark') || 'dark';

const subs = new Set();
const emit = () => subs.forEach((f) => f({ lang, theme }));

/** The strings of the current language. */
export const T = () => LANGS[lang];
export const getLang = () => lang;
export const getTheme = () => theme;
export const onChange = (f) => { subs.add(f); return () => subs.delete(f); };

function applyDocument() {
  document.documentElement.lang = lang;
  document.documentElement.dataset.theme = theme;
  document.title = T().title;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#eef2f1' : '#05080c');
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', theme);
}
applyDocument();

export function setLang(l) {
  if (!LANGS[l] || l === lang) return;
  lang = l;
  store.set('eea.lang', l);
  applyDocument();
  emit();
}
export function cycleLang() {
  setLang(LANG_ORDER[(LANG_ORDER.indexOf(lang) + 1) % LANG_ORDER.length]);
}
export function setTheme(t) {
  if (t !== 'light' && t !== 'dark') return;
  if (t === theme) return;
  theme = t;
  store.set('eea.theme', t);
  applyDocument();
  emit();
}
export const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
