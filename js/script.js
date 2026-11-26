document.addEventListener('DOMContentLoaded', function () {
  const navToggle = document.querySelector('.nav-toggle');
  if (navToggle) navToggle.addEventListener('click', function () {
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) navMenu.classList.toggle('open');
  });
  document.querySelectorAll('.alert').forEach(function (alertEl) {
    setTimeout(function () {
      alertEl.classList.add('fade-out');
      setTimeout(function () { if (alertEl.parentNode) alertEl.remove(); }, 500);
    }, 3000);
  });
});
window.showSetupNotice = function () {
  const message = 'Library services are temporarily unavailable. Please try again later.';
  if (typeof window.showToast === 'function') window.showToast(message, 'error');
  else window.pendingServiceNotice = true;
};
