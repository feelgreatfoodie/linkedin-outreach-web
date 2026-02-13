// Content script — runs on LinkedIn connections page
// Adds a visual indicator that the extension is active

(function () {
  // Only run on connections page
  if (!window.location.href.includes('/mynetwork/invite-connect/connections')) return;

  // Add a small badge to indicate the extension is ready
  const badge = document.createElement('div');
  badge.id = 'outreach-ext-badge';
  badge.textContent = 'Outreach Extension Ready';
  badge.style.cssText = `
    position: fixed;
    bottom: 16px;
    right: 16px;
    background: #0a66c2;
    color: white;
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-weight: 600;
    z-index: 99999;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    opacity: 1;
    transition: opacity 0.5s;
    cursor: pointer;
  `;

  badge.addEventListener('click', () => {
    badge.style.opacity = '0';
    setTimeout(() => badge.remove(), 500);
  });

  document.body.appendChild(badge);

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    badge.style.opacity = '0';
    setTimeout(() => badge.remove(), 500);
  }, 5000);
})();
