const LANGUAGE_STORAGE_KEY = "hexrex:language";
const dictionaries = new Map();
let currentLanguage = "hu";

export async function initI18n() {
  const stored = typeof localStorage !== "undefined" ? localStorage.getItem(LANGUAGE_STORAGE_KEY) : null;
  currentLanguage = stored || "hu";
  await loadLanguage(currentLanguage);
}

export async function setLanguage(language) {
  currentLanguage = language;
  await loadLanguage(language);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }
  document.documentElement.lang = language;
}

export function getLanguage() {
  return currentLanguage;
}

export function t(key, params = {}) {
  const dict = dictionaries.get(currentLanguage) || {};
  const template = dict[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? `{${name}}`));
}

async function loadLanguage(language) {
  if (!dictionaries.has(language)) {
    const response = await fetch(`./src/lang/${language}.json`);
    dictionaries.set(language, await response.json());
  }
  document.documentElement.lang = language;
}
