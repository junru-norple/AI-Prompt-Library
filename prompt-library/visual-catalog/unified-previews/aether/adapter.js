(() => {
  'use strict';
  const focusFacet = () => {
    document.querySelectorAll('.is-target').forEach((element) => element.classList.remove('is-target'));
    const facet = window.location.hash.slice(1) || 'system';
    const target = document.getElementById(facet);
    if (target && facet !== 'system') {
      target.classList.add('is-target');
      requestAnimationFrame(() => {
        const viewport = document.scrollingElement;
        // Scope facet navigation to this specimen; scrollIntoView also moves ancestor frames.
        if (viewport) viewport.scrollTop += target.getBoundingClientRect().top;
      });
    } else if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
  };
  focusFacet();
  window.addEventListener('hashchange', focusFacet);
  const progressButton = document.querySelector('#progress-button');
  progressButton.addEventListener('click', () => {
    progressButton.classList.toggle('done');
    progressButton.textContent = progressButton.classList.contains('done') ? '已完成' : '處理中';
  });
  document.querySelectorAll('.tag.selectable').forEach((tag) => tag.addEventListener('click', () => tag.classList.toggle('selected')));
})();
