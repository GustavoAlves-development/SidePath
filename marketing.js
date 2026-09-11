document.querySelectorAll('.faq-question').forEach(q => {
  q.addEventListener('click', () => {
    const item = q.closest('.faq-item');
    item.dataset.open = item.dataset.open === 'true' ? 'false' : 'true';
  });
});
