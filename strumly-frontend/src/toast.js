// Lightweight toast notifications — no dependencies, works in any component
let container = null;

function getContainer() {
  if (!container || !document.body.contains(container)) {
    container = document.createElement('div');
    container.style.cssText =
      'position:fixed;bottom:24px;right:24px;z-index:99999;display:flex;flex-direction:column-reverse;gap:8px;pointer-events:none;max-width:340px;';
    document.body.appendChild(container);

    if (!document.getElementById('_toast_css')) {
      const s = document.createElement('style');
      s.id = '_toast_css';
      s.textContent =
        '@keyframes _tIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}' +
        '@keyframes _tOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(10px)}}';
      document.head.appendChild(s);
    }
  }
  return container;
}

const STYLES = {
  success: { bg: '#16a34a', border: '#15803d', icon: '✓' },
  error:   { bg: '#dc2626', border: '#b91c1c', icon: '✕' },
  info:    { bg: '#d97706', border: '#b45309', icon: 'ℹ' },
};

function show(message, type = 'info', duration = 3500) {
  const c = getContainer();
  const { bg, border, icon } = STYLES[type] || STYLES.info;

  const el = document.createElement('div');
  el.style.cssText =
    `background:${bg};border:1px solid ${border};color:#fff;` +
    `padding:11px 14px;border-radius:10px;font-size:13px;` +
    `font-family:'DM Sans',sans-serif;font-weight:500;` +
    `box-shadow:0 4px 16px rgba(0,0,0,0.35);pointer-events:auto;` +
    `display:flex;align-items:flex-start;gap:8px;word-break:break-word;` +
    `animation:_tIn .2s ease forwards;`;

  el.innerHTML =
    `<span style="font-weight:700;flex-shrink:0;">${icon}</span>` +
    `<span>${message}</span>`;

  c.appendChild(el);

  const remove = () => {
    el.style.animation = '_tOut .2s ease forwards';
    setTimeout(() => el.remove(), 200);
  };

  el.addEventListener('click', remove);
  setTimeout(remove, duration);
}

const toast = {
  success: (msg, ms) => show(msg, 'success', ms),
  error:   (msg, ms) => show(msg, 'error',   ms),
  info:    (msg, ms) => show(msg, 'info',     ms),
};

export default toast;
