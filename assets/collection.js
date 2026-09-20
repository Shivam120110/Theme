/**
 * collection.js
 * Saanjh Shopify Theme — Collection page JS
 *
 * Responsibilities:
 *   1. Sort dropdown → URL param navigation
 *   2. Filter form → URL param navigation (no AJAX reload required)
 *   3. Filter accordion toggle (details/summary, keyboard)
 *   4. Mobile filter bottom sheet open / close / overlay
 *   5. Filter checkbox → immediate form submit
 */

(function () {
  'use strict';

  /* ─── Selectors ─────────────────────────────────────────────────────────── */
  const SEL = {
    sortSelect:          '[data-sort-select]',
    filterForm:          '[data-filter-form]',
    filterCheckbox:      '[data-filter-checkbox]',
    filterGroup:         '[data-filter-group]',
    filterPanel:         '[data-filter-panel]',
    filterOverlay:       '[data-filter-overlay]',
    filterMobileTrigger: '[data-filter-mobile-trigger]',
    filterClose:         '[data-filter-close]',
    filterApply:         '[data-filter-apply]',
    filterPriceMin:      '[data-filter-price-min]',
    filterPriceMax:      '[data-filter-price-max]',
  };

  /* ─── Utility ────────────────────────────────────────────────────────────── */

  /**
   * Serialise a <form> into a URLSearchParams object,
   * removing empty-string values.
   * @param {HTMLFormElement} form
   * @returns {URLSearchParams}
   */
  function formToParams(form) {
    const data = new FormData(form);
    const params = new URLSearchParams();
    for (const [key, value] of data.entries()) {
      if (value !== '') params.append(key, value);
    }
    return params;
  }

  /**
   * Navigate to new URL keeping existing pathname.
   * @param {URLSearchParams} params
   */
  function navigateTo(params) {
    const url = new URL(window.location.href);
    url.search = params.toString();
    window.location.assign(url.toString());
  }

  /* ─── 1. Sort Dropdown ───────────────────────────────────────────────────── */
  function initSort() {
    const sortSelect = document.querySelector(SEL.sortSelect);
    if (!sortSelect) return;

    sortSelect.addEventListener('change', () => {
      const url = new URL(window.location.href);
      url.searchParams.set('sort_by', sortSelect.value);
      // Reset to page 1 when sort changes
      url.searchParams.delete('page');
      window.location.assign(url.toString());
    });
  }

  /* ─── 2 & 5. Filter Form Submission ─────────────────────────────────────── */
  function initFilterForm() {
    const form = document.querySelector(SEL.filterForm);
    if (!form) return;

    /* Checkbox change → submit immediately */
    form.querySelectorAll(SEL.filterCheckbox).forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        // Reset to page 1 on filter change
        const pageInput = form.querySelector('input[name="page"]');
        if (pageInput) pageInput.remove();
        form.submit();
      });
    });

    /* Standard form submit (price apply button) */
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const params = formToParams(form);
      params.delete('page'); // back to page 1
      navigateTo(params);
    });
  }

  /* ─── 3. Filter Accordion Toggle ─────────────────────────────────────────── */
  /**
   * <details> elements handle open/close natively.
   * We only need to:
   *  - update aria-expanded on <summary> for screen readers
   *  - ensure keyboard Enter/Space works (it does natively)
   */
  function initFilterAccordions() {
    document.querySelectorAll(SEL.filterGroup).forEach((details) => {
      const summary = details.querySelector('summary');
      if (!summary) return;

      // Sync aria-expanded with open state
      function syncAria() {
        summary.setAttribute('aria-expanded', details.open ? 'true' : 'false');
      }

      // Initial sync
      syncAria();

      // <details> fires 'toggle' when open state changes
      details.addEventListener('toggle', syncAria);
    });
  }

  /* ─── 4. Mobile Filter Bottom Sheet ─────────────────────────────────────── */
  function initMobileFilter() {
    const panel   = document.querySelector(SEL.filterPanel);
    const overlay = document.querySelector(SEL.filterOverlay);
    const trigger = document.querySelector(SEL.filterMobileTrigger);
    const closeBtn = document.querySelector(SEL.filterClose);
    const applyBtn = document.querySelector(SEL.filterApply);

    if (!panel || !overlay || !trigger) return;

    /** Focus trap — cycle through focusable elements inside the panel */
    function getFocusable() {
      return Array.from(
        panel.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      );
    }

    function openPanel() {
      panel.classList.add('is-open');
      panel.setAttribute('aria-hidden', 'false');
      overlay.classList.add('is-visible');
      overlay.setAttribute('aria-hidden', 'false');
      trigger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';

      // Move focus into panel
      const focusable = getFocusable();
      if (focusable.length) focusable[0].focus();
    }

    function closePanel() {
      panel.classList.remove('is-open');
      panel.setAttribute('aria-hidden', 'true');
      overlay.classList.remove('is-visible');
      overlay.setAttribute('aria-hidden', 'true');
      trigger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      trigger.focus();
    }

    trigger.addEventListener('click', openPanel);
    overlay.addEventListener('click', closePanel);
    if (closeBtn) closeBtn.addEventListener('click', closePanel);

    /* Apply button: submit the filter form and close */
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        const form = document.querySelector(SEL.filterForm);
        if (form) {
          closePanel();
          form.submit();
        }
      });
    }

    /* Escape key closes panel */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) {
        closePanel();
      }
    });

    /* Focus trap within open panel */
    panel.addEventListener('keydown', (e) => {
      if (!panel.classList.contains('is-open')) return;
      if (e.key !== 'Tab') return;

      const focusable = getFocusable();
      if (!focusable.length) return;

      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* ─── Init ───────────────────────────────────────────────────────────────── */
  function init() {
    initSort();
    initFilterForm();
    initFilterAccordions();
    initMobileFilter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
