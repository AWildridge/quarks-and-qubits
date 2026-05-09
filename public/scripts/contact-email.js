document.addEventListener('DOMContentLoaded', () => {
  const emailLink = document.getElementById('email-link');
  if (!emailLink) return;

  const user = emailLink.dataset.user || '';
  const domain = emailLink.dataset.domain || '';
  const email = `${user}@${domain}`;

  function reveal(event) {
    if (event) event.preventDefault();
    emailLink.href = `mailto:${email}`;
    emailLink.textContent = email;
  }

  emailLink.addEventListener('click', reveal, { once: true });
  emailLink.addEventListener('focus', () => {
    if (emailLink.textContent === 'Click to reveal email') reveal();
  });
});
