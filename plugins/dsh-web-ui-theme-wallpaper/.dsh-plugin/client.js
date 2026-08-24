window.__ModuleLoader__.load({
	id: "dsh-web-ui-theme-wallpaper",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// .dsh-plugin/client/index.mjs
var index_exports = {};
__export(index_exports, {
  STORAGE_KEY: () => STORAGE_KEY,
  THEMES: () => THEMES,
  WALLPAPERS: () => WALLPAPERS,
  WALLPAPER_ROOT_ID: () => WALLPAPER_ROOT_ID,
  apply: () => apply,
  applyWallpaper: () => applyWallpaper,
  inject: () => inject,
  name: () => name,
  normalizeSettings: () => normalizeSettings,
  safeWallpaperSource: () => safeWallpaperSource,
  wallpaperPresentation: () => wallpaperPresentation
});
module.exports = __toCommonJS(index_exports);
var import_react = require("react");
var name = "dsh-web-ui-theme-wallpaper";
var inject = ["slots", "theme"];
var STORAGE_KEY = "dsh-web-ui-theme-wallpaper:v1";
var WALLPAPER_ROOT_ID = "dsh-web-ui-theme-wallpaper-root";
var THEMES = Object.freeze([
  {
    id: "dsh-midnight",
    label: "\u5348\u591C\u84DD",
    description: "\u6DF1\u6D77\u84DD\u5E95\u4E0E\u51B7\u7D2B\u5F3A\u8C03\u8272\uFF0C\u9002\u5408\u957F\u65F6\u95F4\u5DE5\u4F5C\u3002",
    colorScheme: "dark",
    swatch: ["#0b1225", "#172951", "#8f7bff"],
    tokens: {
      "--dsw-alias-bg-base": "#0b1225",
      "--dsw-alias-bg-layer-1": "#111c35",
      "--dsw-alias-bg-layer-2": "#172545",
      "--dsw-alias-bg-overlay": "#182642",
      "--dsw-alias-border-l1": "rgba(147, 174, 229, .16)",
      "--dsw-alias-border-l2": "rgba(147, 174, 229, .28)",
      "--dsw-alias-brand-primary": "#8f7bff",
      "--dsw-alias-label-primary": "#edf3ff",
      "--dsw-alias-label-secondary": "#a9b9d9",
      "--dsw-specific-sidebar-fill": "#0d172c"
    }
  },
  {
    id: "dsh-sakura",
    label: "\u6A31\u82B1",
    description: "\u6696\u767D\u5E95\u3001\u67D4\u7C89\u8FB9\u6846\u548C\u8393\u7EA2\u5F3A\u8C03\u8272\u3002",
    colorScheme: "light",
    swatch: ["#fff8fb", "#ffe6ef", "#c34576"],
    tokens: {
      "--dsw-alias-bg-base": "#fff8fb",
      "--dsw-alias-bg-layer-1": "#fffdfd",
      "--dsw-alias-bg-layer-2": "#ffeef4",
      "--dsw-alias-bg-overlay": "#fffafd",
      "--dsw-alias-border-l1": "rgba(174, 79, 116, .16)",
      "--dsw-alias-border-l2": "rgba(174, 79, 116, .28)",
      "--dsw-alias-brand-primary": "#c34576",
      "--dsw-alias-label-primary": "#321b28",
      "--dsw-alias-label-secondary": "#765264",
      "--dsw-specific-sidebar-fill": "#fff1f6"
    }
  },
  {
    id: "dsh-emerald",
    label: "\u7FE1\u7FE0",
    description: "\u4F4E\u9971\u548C\u58A8\u7EFF\u5DE5\u4F5C\u53F0\uFF0C\u51CF\u5C11\u9AD8\u4EAE\u8272\u5E72\u6270\u3002",
    colorScheme: "dark",
    swatch: ["#0d1c1a", "#15372f", "#4ec9a1"],
    tokens: {
      "--dsw-alias-bg-base": "#0d1c1a",
      "--dsw-alias-bg-layer-1": "#112723",
      "--dsw-alias-bg-layer-2": "#17342e",
      "--dsw-alias-bg-overlay": "#17312c",
      "--dsw-alias-border-l1": "rgba(118, 212, 177, .16)",
      "--dsw-alias-border-l2": "rgba(118, 212, 177, .29)",
      "--dsw-alias-brand-primary": "#4ec9a1",
      "--dsw-alias-label-primary": "#e9fff6",
      "--dsw-alias-label-secondary": "#9cc8ba",
      "--dsw-specific-sidebar-fill": "#0e2420"
    }
  },
  {
    id: "dsh-paper",
    label: "\u7EB8\u5F20",
    description: "\u67D4\u548C\u7C73\u767D\u4E0E\u9752\u7070\u8272\uFF0C\u9002\u5408\u6587\u6863\u548C\u9605\u8BFB\u3002",
    colorScheme: "light",
    swatch: ["#f6f4ee", "#ffffff", "#476b78"],
    tokens: {
      "--dsw-alias-bg-base": "#f6f4ee",
      "--dsw-alias-bg-layer-1": "#ffffff",
      "--dsw-alias-bg-layer-2": "#eef2f1",
      "--dsw-alias-bg-overlay": "#ffffff",
      "--dsw-alias-border-l1": "rgba(61, 88, 96, .16)",
      "--dsw-alias-border-l2": "rgba(61, 88, 96, .28)",
      "--dsw-alias-brand-primary": "#476b78",
      "--dsw-alias-label-primary": "#1f2b2d",
      "--dsw-alias-label-secondary": "#5e7073",
      "--dsw-specific-sidebar-fill": "#eceae3"
    }
  }
]);
var WALLPAPERS = Object.freeze([
  { id: "none", label: "\u65E0\u58C1\u7EB8", description: "\u4F7F\u7528\u4E3B\u9898\u672C\u8EAB\u7684\u80CC\u666F\u3002", background: "linear-gradient(135deg, #101827, #17213b)" },
  { id: "aurora", label: "\u6781\u5149", description: "\u84DD\u7D2B\u6781\u5149\u4E0E\u67D4\u548C\u5149\u6655\u3002", background: "radial-gradient(circle at 18% 18%, rgba(93, 179, 255, .8), transparent 34%), radial-gradient(circle at 80% 10%, rgba(184, 105, 255, .65), transparent 34%), linear-gradient(135deg, #081528, #161634 56%, #0b1e2b)" },
  { id: "night-grid", label: "\u591C\u7F51\u683C", description: "\u4F4E\u5BF9\u6BD4\u7F51\u683C\uFF0C\u9002\u5408\u4EE3\u7801\u5DE5\u4F5C\u533A\u3002", background: "linear-gradient(rgba(93, 142, 214, .12) 1px, transparent 1px), linear-gradient(90deg, rgba(93, 142, 214, .12) 1px, transparent 1px), linear-gradient(135deg, #08111f, #111d32)", size: "42px 42px, 42px 42px, auto" },
  { id: "paper-light", label: "\u7EB8\u5F20\u7EB9\u7406", description: "\u6696\u767D\u7EB8\u5F20\u7684\u7EC6\u5BC6\u6E10\u53D8\u3002", background: "radial-gradient(rgba(62, 74, 78, .12) .7px, transparent .7px), linear-gradient(135deg, #f8f5ed, #dfe9e5)", size: "8px 8px, auto" }
]);
var DEFAULT_SETTINGS = Object.freeze({
  wallpaper: "aurora",
  customSource: "",
  opacity: 0.48,
  blur: 0,
  overlay: "#07111f",
  overlayOpacity: 0.32,
  accent: "#8f7bff"
});
var currentSettings = loadStoredSettings();
var settingsListeners = /* @__PURE__ */ new Set();
var accentDisposer = null;
var CSS = `
body { isolation: isolate; }
body > *:not(#${WALLPAPER_ROOT_ID}) { position: relative; z-index: 1; }
#${WALLPAPER_ROOT_ID} { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; background: #101827; }
#${WALLPAPER_ROOT_ID} .dsh-wuw-image, #${WALLPAPER_ROOT_ID} .dsh-wuw-overlay { position: absolute; inset: -24px; pointer-events: none; }
#${WALLPAPER_ROOT_ID} .dsh-wuw-image { background-position: center; background-repeat: no-repeat; background-size: cover; transform: scale(1.04); transition: background .24s ease, opacity .24s ease, filter .24s ease; }
#${WALLPAPER_ROOT_ID} .dsh-wuw-overlay { background: #07111f; transition: background .24s ease, opacity .24s ease; }
.dsh-wuw-panel { color: var(--dsw-alias-label-primary, #e8edf7); padding: 4px 0 24px; max-width: 900px; }
.dsh-wuw-intro { color: var(--dsw-alias-label-secondary, #9aa9c2); margin: 0 0 18px; line-height: 1.6; }
.dsh-wuw-block { border-top: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.12)); padding: 18px 0 4px; }
.dsh-wuw-block h3 { margin: 0 0 5px; font-size: 14px; font-weight: 650; }
.dsh-wuw-hint { margin: 0 0 12px; color: var(--dsw-alias-label-secondary, #9aa9c2); font-size: 12px; line-height: 1.5; }
.dsh-wuw-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; }
.dsh-wuw-card { display: flex; gap: 10px; text-align: left; border: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.12)); background: var(--dsw-alias-bg-layer-1, rgba(20,30,51,.8)); color: inherit; border-radius: 7px; padding: 11px; cursor: pointer; min-height: 74px; transition: border-color .18s ease, transform .18s ease, background .18s ease; }
.dsh-wuw-card:hover { transform: translateY(-1px); border-color: var(--dsw-alias-brand-primary, #8f7bff); }
.dsh-wuw-card.is-active { border-color: var(--dsw-alias-brand-primary, #8f7bff); box-shadow: 0 0 0 1px color-mix(in srgb, var(--dsw-alias-brand-primary, #8f7bff) 50%, transparent); }
.dsh-wuw-swatch { flex: 0 0 48px; height: 48px; border-radius: 5px; border: 1px solid rgba(255,255,255,.22); }
.dsh-wuw-card-copy { display: flex; min-width: 0; flex-direction: column; gap: 4px; }
.dsh-wuw-card-title { font-size: 13px; font-weight: 650; }
.dsh-wuw-card-desc { color: var(--dsw-alias-label-secondary, #9aa9c2); font-size: 11px; line-height: 1.35; }
.dsh-wuw-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 12px; }
.dsh-wuw-row label { color: var(--dsw-alias-label-secondary, #9aa9c2); font-size: 12px; }
.dsh-wuw-row input[type=file] { max-width: 220px; font-size: 12px; }
.dsh-wuw-row input[type=url] { min-width: min(420px, 100%); flex: 1; border: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.12)); border-radius: 5px; padding: 8px 9px; background: var(--dsw-alias-bg-layer-2, rgba(20,30,51,.8)); color: inherit; }
.dsh-wuw-action, .dsh-wuw-reset { border: 1px solid var(--dsw-alias-border-l2, rgba(255,255,255,.2)); border-radius: 5px; padding: 7px 12px; background: var(--dsw-alias-bg-layer-2, rgba(20,30,51,.8)); color: inherit; cursor: pointer; font: inherit; font-size: 12px; }
.dsh-wuw-action:hover, .dsh-wuw-reset:hover { border-color: var(--dsw-alias-brand-primary, #8f7bff); }
.dsh-wuw-range { display: grid; grid-template-columns: 110px minmax(120px, 1fr) 48px; gap: 8px; align-items: center; width: min(520px, 100%); margin-top: 12px; font-size: 12px; color: var(--dsw-alias-label-secondary, #9aa9c2); }
.dsh-wuw-range input { width: 100%; accent-color: var(--dsw-alias-brand-primary, #8f7bff); }
.dsh-wuw-color { width: 34px; height: 27px; border: 0; padding: 0; background: transparent; }
.dsh-wuw-status { min-height: 20px; margin-top: 10px; color: var(--dsw-alias-brand-primary, #8f7bff); font-size: 12px; }
@media (max-width: 620px) { .dsh-wuw-range { grid-template-columns: 94px minmax(90px, 1fr) 44px; } .dsh-wuw-grid { grid-template-columns: 1fr; } }
`;
function storage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}
function isHexColor(value) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}
function safeWallpaperSource(value) {
  if (typeof value !== "string" || value.length > 8 * 1024 * 1024) return "";
  if (/^https:\/\//i.test(value)) return value;
  if (/^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(value)) return value;
  return "";
}
function normalizeSettings(value) {
  const candidate = value && typeof value === "object" ? value : {};
  const wallpaper = [...WALLPAPERS.map((item) => item.id), "custom"].includes(candidate.wallpaper) ? candidate.wallpaper : DEFAULT_SETTINGS.wallpaper;
  const opacity = Number(candidate.opacity);
  const blur = Number(candidate.blur);
  const overlayOpacity = Number(candidate.overlayOpacity);
  return {
    wallpaper,
    customSource: safeWallpaperSource(candidate.customSource),
    opacity: Number.isFinite(opacity) ? Math.min(1, Math.max(0, opacity)) : DEFAULT_SETTINGS.opacity,
    blur: Number.isFinite(blur) ? Math.min(20, Math.max(0, blur)) : DEFAULT_SETTINGS.blur,
    overlay: isHexColor(candidate.overlay) ? candidate.overlay : DEFAULT_SETTINGS.overlay,
    overlayOpacity: Number.isFinite(overlayOpacity) ? Math.min(0.9, Math.max(0, overlayOpacity)) : DEFAULT_SETTINGS.overlayOpacity,
    accent: isHexColor(candidate.accent) ? candidate.accent : DEFAULT_SETTINGS.accent
  };
}
function loadStoredSettings() {
  const value = storage()?.getItem(STORAGE_KEY);
  if (value === null || value === void 0) return { ...DEFAULT_SETTINGS };
  try {
    return normalizeSettings(JSON.parse(value));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}
function persistSettings() {
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(currentSettings));
  } catch {
  }
}
function cssUrl(value) {
  return `url("${String(value).replace(/["\\\r\n]/g, (char) => `\\${char}`)}")`;
}
function wallpaperPresentation(value = currentSettings) {
  const settings = normalizeSettings(value);
  const preset = WALLPAPERS.find((item) => item.id === settings.wallpaper);
  const backgroundImage = settings.wallpaper === "custom" && settings.customSource !== "" ? cssUrl(settings.customSource) : preset?.background ?? WALLPAPERS[0].background;
  return {
    backgroundImage,
    backgroundSize: preset?.size ?? "cover",
    opacity: settings.wallpaper === "none" ? 0 : settings.opacity,
    blur: settings.blur,
    overlay: settings.overlay,
    overlayOpacity: settings.overlayOpacity
  };
}
function ensureWallpaperRoot() {
  if (typeof document === "undefined" || document.body === null) return null;
  let style = document.getElementById(`${WALLPAPER_ROOT_ID}-styles`);
  if (style === null) {
    style = document.createElement("style");
    style.id = `${WALLPAPER_ROOT_ID}-styles`;
    style.textContent = CSS;
    document.head.append(style);
  }
  let root = document.getElementById(WALLPAPER_ROOT_ID);
  if (root === null) {
    root = document.createElement("div");
    root.id = WALLPAPER_ROOT_ID;
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = '<div class="dsh-wuw-image"></div><div class="dsh-wuw-overlay"></div>';
    document.body.prepend(root);
  }
  return root;
}
function applyWallpaper(value = currentSettings) {
  const root = ensureWallpaperRoot();
  if (root === null) return;
  const presentation = wallpaperPresentation(value);
  const image = root.querySelector(".dsh-wuw-image");
  const overlay = root.querySelector(".dsh-wuw-overlay");
  if (!(image instanceof HTMLElement) || !(overlay instanceof HTMLElement)) return;
  image.style.backgroundImage = presentation.backgroundImage;
  image.style.backgroundSize = presentation.backgroundSize;
  image.style.opacity = String(presentation.opacity);
  image.style.filter = `blur(${presentation.blur}px) saturate(1.08)`;
  overlay.style.background = presentation.overlay;
  overlay.style.opacity = String(presentation.overlayOpacity);
  root.dataset.wallpaper = value.wallpaper;
}
function updateSettings(patch) {
  currentSettings = normalizeSettings({ ...currentSettings, ...patch });
  persistSettings();
  applyWallpaper(currentSettings);
  for (const listener of settingsListeners) listener(currentSettings);
}
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(typeof reader.result === "string" ? reader.result : ""));
    reader.addEventListener("error", () => reject(reader.error ?? new Error("\u8BFB\u53D6\u56FE\u7247\u5931\u8D25")));
    reader.readAsDataURL(file);
  });
}
function swatchStyle(colors) {
  return { background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]} 55%, ${colors[2]})` };
}
function ThemeCard({ theme, active, onClick }) {
  return (0, import_react.createElement)(
    "button",
    { type: "button", className: `dsh-wuw-card${active ? " is-active" : ""}`, onClick },
    (0, import_react.createElement)("span", { className: "dsh-wuw-swatch", style: swatchStyle(theme.swatch), "aria-hidden": "true" }),
    (0, import_react.createElement)(
      "span",
      { className: "dsh-wuw-card-copy" },
      (0, import_react.createElement)("span", { className: "dsh-wuw-card-title" }, theme.label),
      (0, import_react.createElement)("span", { className: "dsh-wuw-card-desc" }, theme.description),
      active ? (0, import_react.createElement)("span", { className: "dsh-wuw-card-desc" }, "\u4F7F\u7528\u4E2D") : null
    )
  );
}
function WallpaperCard({ wallpaper, active, onClick }) {
  return (0, import_react.createElement)(
    "button",
    { type: "button", className: `dsh-wuw-card${active ? " is-active" : ""}`, onClick },
    (0, import_react.createElement)("span", { className: "dsh-wuw-swatch", style: { background: wallpaper.background, backgroundSize: wallpaper.size ?? "cover" }, "aria-hidden": "true" }),
    (0, import_react.createElement)(
      "span",
      { className: "dsh-wuw-card-copy" },
      (0, import_react.createElement)("span", { className: "dsh-wuw-card-title" }, wallpaper.label),
      (0, import_react.createElement)("span", { className: "dsh-wuw-card-desc" }, wallpaper.description),
      active ? (0, import_react.createElement)("span", { className: "dsh-wuw-card-desc" }, "\u4F7F\u7528\u4E2D") : null
    )
  );
}
function ThemeWallpaperSection({ ctx, theme }) {
  const [state, setState] = (0, import_react.useState)(currentSettings);
  const [snapshot, setSnapshot] = (0, import_react.useState)(() => theme.getTheme?.() ?? null);
  const [urlDraft, setUrlDraft] = (0, import_react.useState)("");
  const [status, setStatus] = (0, import_react.useState)("");
  (0, import_react.useEffect)(() => {
    const listener = (next) => setState(next);
    settingsListeners.add(listener);
    return () => settingsListeners.delete(listener);
  }, []);
  (0, import_react.useEffect)(() => {
    if (typeof ctx.on !== "function") return void 0;
    return ctx.on("theme/change", (next) => setSnapshot(next));
  }, [ctx]);
  const change = (patch) => {
    updateSettings(patch);
    setStatus("\u8BBE\u7F6E\u5DF2\u4FDD\u5B58");
  };
  const activeTheme = snapshot?.preference ?? "system";
  const chooseTheme = (id) => {
    try {
      theme.setTheme(id);
      setStatus(`\u5DF2\u5207\u6362\u5230${id === "system" ? "\u7CFB\u7EDF\u4E3B\u9898" : THEMES.find((item) => item.id === id)?.label ?? id}`);
    } catch (error) {
      setStatus(`\u4E3B\u9898\u5207\u6362\u5931\u8D25\uFF1A${String(error)}`);
    }
  };
  const chooseFile = async (event) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (file === void 0) return;
    if (!file.type.startsWith("image/")) {
      setStatus("\u8BF7\u9009\u62E9\u56FE\u7247\u6587\u4EF6");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatus("\u56FE\u7247\u4E0D\u80FD\u8D85\u8FC7 5 MB");
      return;
    }
    try {
      const source = safeWallpaperSource(await readFileAsDataUrl(file));
      if (source === "") throw new Error("\u56FE\u7247\u683C\u5F0F\u4E0D\u53D7\u652F\u6301");
      change({ wallpaper: "custom", customSource: source });
    } catch (error) {
      setStatus(String(error));
    }
  };
  const applyUrl = () => {
    const source = safeWallpaperSource(urlDraft.trim());
    if (source === "") {
      setStatus("\u53EA\u5141\u8BB8 https \u56FE\u7247\u5730\u5740");
      return;
    }
    change({ wallpaper: "custom", customSource: source });
    setUrlDraft("");
  };
  const reset = () => {
    updateSettings(DEFAULT_SETTINGS);
    try {
      theme.setTheme("system");
    } catch {
    }
    setStatus("\u5DF2\u6062\u590D\u9ED8\u8BA4\u4E3B\u9898\u4E0E\u58C1\u7EB8");
  };
  return (0, import_react.createElement)(
    "div",
    { className: "dsh-wuw-panel" },
    (0, import_react.createElement)("p", { className: "dsh-wuw-intro" }, "\u72EC\u7ACB\u7684\u4E3B\u9898\u4E0E\u58C1\u7EB8\u4E2D\u5FC3\u3002\u4E3B\u9898\u901A\u8FC7 Harness \u539F\u751F\u4E3B\u9898\u670D\u52A1\u751F\u6548\uFF0C\u58C1\u7EB8\u53EA\u4F5C\u7528\u4E8E Web \u754C\u9762\u80CC\u666F\uFF0C\u4E0D\u6539\u53D8\u4F1A\u8BDD\u3001\u6A21\u578B\u6216\u63D2\u4EF6\u6570\u636E\u3002"),
    (0, import_react.createElement)(
      "section",
      { className: "dsh-wuw-block" },
      (0, import_react.createElement)("h3", null, "\u754C\u9762\u4E3B\u9898"),
      (0, import_react.createElement)("p", { className: "dsh-wuw-hint" }, "\u4E3B\u9898\u989C\u8272\u4F1A\u8986\u76D6\u539F\u751F\u4EE4\u724C\uFF1B\u7CFB\u7EDF\u4E3B\u9898\u4F1A\u8DDF\u968F\u64CD\u4F5C\u7CFB\u7EDF\u7684\u660E\u6697\u504F\u597D\u3002"),
      (0, import_react.createElement)(
        "div",
        { className: "dsh-wuw-grid" },
        (0, import_react.createElement)(ThemeCard, { theme: { label: "\u8DDF\u968F\u7CFB\u7EDF", description: "\u4F7F\u7528\u64CD\u4F5C\u7CFB\u7EDF\u7684\u660E\u6697\u504F\u597D\u3002", swatch: ["#f6f8fb", "#1b2946", "#6f82a8"] }, active: activeTheme === "system", onClick: () => chooseTheme("system") }),
        ...THEMES.map((item) => (0, import_react.createElement)(ThemeCard, { key: item.id, theme: item, active: activeTheme === item.id, onClick: () => chooseTheme(item.id) }))
      )
    ),
    (0, import_react.createElement)(
      "section",
      { className: "dsh-wuw-block" },
      (0, import_react.createElement)("h3", null, "\u58C1\u7EB8"),
      (0, import_react.createElement)("p", { className: "dsh-wuw-hint" }, "\u9884\u7F6E\u58C1\u7EB8\u4E0D\u8054\u7F51\uFF1B\u81EA\u5B9A\u4E49\u56FE\u7247\u53EA\u4FDD\u5B58\u5728\u672C\u673A\u5F53\u524D\u6D4F\u89C8\u5668\u3002"),
      (0, import_react.createElement)("div", { className: "dsh-wuw-grid" }, WALLPAPERS.map((item) => (0, import_react.createElement)(WallpaperCard, { key: item.id, wallpaper: item, active: state.wallpaper === item.id, onClick: () => change({ wallpaper: item.id }) }))),
      (0, import_react.createElement)(
        "div",
        { className: "dsh-wuw-row" },
        (0, import_react.createElement)("label", null, "\u9009\u62E9\u672C\u673A\u56FE\u7247"),
        (0, import_react.createElement)("input", { type: "file", accept: "image/png,image/jpeg,image/webp,image/gif", onChange: chooseFile })
      ),
      (0, import_react.createElement)(
        "div",
        { className: "dsh-wuw-row" },
        (0, import_react.createElement)("input", { type: "url", value: urlDraft, placeholder: "https://example.com/wallpaper.webp", onChange: (event) => setUrlDraft(event.currentTarget.value), "aria-label": "\u58C1\u7EB8 URL" }),
        (0, import_react.createElement)("button", { type: "button", className: "dsh-wuw-action", onClick: applyUrl }, "\u5E94\u7528\u56FE\u7247\u5730\u5740")
      )
    ),
    (0, import_react.createElement)(
      "section",
      { className: "dsh-wuw-block" },
      (0, import_react.createElement)("h3", null, "\u663E\u793A\u8C03\u8282"),
      (0, import_react.createElement)("div", { className: "dsh-wuw-range" }, (0, import_react.createElement)("span", null, "\u58C1\u7EB8\u900F\u660E\u5EA6"), (0, import_react.createElement)("input", { type: "range", min: 0, max: 100, value: Math.round(state.opacity * 100), onChange: (event) => change({ opacity: Number(event.currentTarget.value) / 100 }) }), (0, import_react.createElement)("span", null, `${Math.round(state.opacity * 100)}%`)),
      (0, import_react.createElement)("div", { className: "dsh-wuw-range" }, (0, import_react.createElement)("span", null, "\u80CC\u666F\u6A21\u7CCA"), (0, import_react.createElement)("input", { type: "range", min: 0, max: 20, value: state.blur, onChange: (event) => change({ blur: Number(event.currentTarget.value) }) }), (0, import_react.createElement)("span", null, `${state.blur}px`)),
      (0, import_react.createElement)("div", { className: "dsh-wuw-range" }, (0, import_react.createElement)("span", null, "\u524D\u666F\u906E\u7F69"), (0, import_react.createElement)("input", { type: "range", min: 0, max: 90, value: Math.round(state.overlayOpacity * 100), onChange: (event) => change({ overlayOpacity: Number(event.currentTarget.value) / 100 }) }), (0, import_react.createElement)("span", null, `${Math.round(state.overlayOpacity * 100)}%`)),
      (0, import_react.createElement)("div", { className: "dsh-wuw-row" }, (0, import_react.createElement)("label", null, "\u5F3A\u8C03\u8272"), (0, import_react.createElement)("input", { className: "dsh-wuw-color", type: "color", value: state.accent, onChange: (event) => change({ accent: event.currentTarget.value }), "aria-label": "\u4E3B\u9898\u5F3A\u8C03\u8272" }), (0, import_react.createElement)("span", { className: "dsh-wuw-hint", style: { margin: 0 } }, state.accent))
    ),
    (0, import_react.createElement)("div", { className: "dsh-wuw-row" }, (0, import_react.createElement)("button", { type: "button", className: "dsh-wuw-reset", onClick: reset }, "\u6062\u590D\u9ED8\u8BA4"), (0, import_react.createElement)("span", { className: "dsh-wuw-status", role: "status" }, status))
  );
}
function applyAccent(theme, value) {
  if (typeof theme.overrideTokens !== "function") return;
  try {
    accentDisposer?.();
    accentDisposer = theme.overrideTokens("dsh-web-ui-theme-wallpaper", {
      "--dsw-alias-brand-primary": { light: value, dark: value }
    });
  } catch {
  }
}
function apply(ctx) {
  const theme = ctx.theme;
  const setup = () => {
    const registered = [];
    if (typeof theme?.register === "function") {
      for (const definition of THEMES) {
        try {
          registered.push(theme.register(definition));
        } catch (error) {
          ctx.logger?.debug?.(`dsh-web-ui-theme-wallpaper: theme ${definition.id} unavailable: ${String(error)}`);
        }
      }
      applyAccent(theme, currentSettings.accent);
    }
    applyWallpaper(currentSettings);
    return () => {
      for (const dispose of registered.reverse()) dispose?.();
      accentDisposer?.();
      accentDisposer = null;
      document.getElementById(WALLPAPER_ROOT_ID)?.remove();
      document.getElementById(`${WALLPAPER_ROOT_ID}-styles`)?.remove();
    };
  };
  if (typeof ctx.effect === "function") ctx.effect(setup, "dsh-web-ui-theme-wallpaper: runtime");
  else setup();
  if (typeof ctx.slots?.inject !== "function") return;
  ctx.slots.inject("settings.section", () => ctx.slots.register({
    name: "settings.section",
    id: "dsh-web-ui-theme-wallpaper",
    order: 45,
    label: () => "\u4E3B\u9898\u4E0E\u58C1\u7EB8"
  }, () => (0, import_react.createElement)(ThemeWallpaperSection, { ctx, theme })));
}
		return module.exports;
	}
});
