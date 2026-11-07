export const THEME_STORAGE_KEY = "hippo-theme";

/** No saved choice means light; explicit dark and system remain intact. */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var s=localStorage.getItem('hippo-theme');var m=(s==='light'||s==='dark'||s==='system')?s:'light';var r=m==='system'?(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):m;var h=document.documentElement;h.setAttribute('data-theme',r);if(r==='light'){h.classList.remove('dark');h.classList.add('light');}else{h.classList.remove('light');h.classList.add('dark');}var meta=document.querySelector('meta[name="theme-color"]');if(meta){meta.setAttribute('content',r==='light'?'#f8fafc':'#0a0a0f');}}catch(e){}})();`;
