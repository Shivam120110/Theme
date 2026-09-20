/**
 * assets/header.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Saanjh — Site Header Behaviour (Vanilla ES6+, no framework dependencies)
 *
 * Features:
 *   1. Scroll shadow  — adds `.has-shadow` to header on scroll
 *   2. Search toggle  — expand / collapse inline search bar
 *   3. Mobile drawer  — open / close off-canvas nav drawer
 *       • aria-expanded & aria-hidden management
 *       • Focus trap within drawer while open
 *       • Body scroll lock (padding-compensated)
 *       • Escape key and overlay-click dismiss
 *   4. Cart count     — live update via Shopify /cart.js fetch
 *   5. Announcement   — dismiss / session-persist
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────────────────
     Utility helpers
     ───────────────────────────────────────────────────────────────────────── */

  /**
   * Query a single element; throws clearly if not found when required.
   * @param {string} selector
   * @param {Element|Document} [root=document]
   * @param {boolean} [required=false]
   * @returns {Element|null}
   */
  function qs(selector, root, required) {
    root = root || document;
    const el = root.querySelector(selector);
    if (required && !el) {
      console.warn('[Saanjh Header] Element not found:', selector);
    }
    return el;
  }

  /**
   * Query all matching elements as a plain array.
   * @param {string} selector
   * @param {Element|Document} [root=document]
   * @returns {Element[]}
   */
  function qsa(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  /**
   * Returns all focusable child elements within a container.
   * Used for focus trapping in the drawer.
   * @param {Element} container
   * @returns {Element[]}
   */
  function getFocusable(container) {
    return qsa(
      'a[href], button:not([disabled]), input:not([disabled]), ' +
      'select:not([disabled]), textarea:not([disabled]), ' +
      '[tabindex]:not([tabindex="-1"])',
      container
    );
  }

  /* ─────────────────────────────────────────────────────────────────────────
     1. Scroll Shadow
     ───────────────────────────────────────────────────────────────────────── */
  (function initScrollShadow() {
    const header = qs('#site-header');
    if (!header) return;

    /**
     * Toggle `.has-shadow` based on whether the page has scrolled past 4px.
     * 4px threshold avoids flickering at exact scroll position 0.
     */
    function onScroll() {
      header.classList.toggle('has-shadow', window.scrollY > 4);
    }

    // Use passive listener for scroll — no need to call preventDefault
    window.addEventListener('scroll', onScroll, { passive: true });

    // Run once on load in case page starts mid-scroll (e.g. after refresh)
    onScroll();
  })();

  /* ─────────────────────────────────────────────────────────────────────────
     2. Search Toggle
     ───────────────────────────────────────────────────────────────────────── */
  (function initSearch() {
    const toggleBtns  = qsa('.js-search-toggle');
    const searchPanel = qs('#site-search');
    const searchInput = qs('[data-search-input]');

    if (!searchPanel || toggleBtns.length === 0) return;

    let isOpen = false;

    /**
     * Open or close the search panel.
     * @param {boolean} open
     */
    function setSearchOpen(open) {
      isOpen = open;

      if (open) {
        searchPanel.removeAttribute('hidden');
        searchPanel.setAttribute('aria-hidden', 'false');
        // Focus input after transition (300ms)
        setTimeout(function () {
          if (searchInput) searchInput.focus();
        }, 320);
      } else {
        searchPanel.setAttribute('aria-hidden', 'true');
        // Re-add hidden after CSS transition completes
        setTimeout(function () {
          searchPanel.setAttribute('hidden', '');
        }, 310);
      }

      // Update all toggle button states
      toggleBtns.forEach(function (btn) {
        if (btn.classList.contains('js-search-toggle')) {
          const isToggle = !btn.classList.contains('site-search__close');
          if (isToggle) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        }
      });
    }

    // Wire up all toggle buttons (open button + close button inside panel)
    toggleBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        setSearchOpen(!isOpen);
      });
    });

    // Escape key closes search
    document.addEventListener('keydown', function (e) {
      if (isOpen && (e.key === 'Escape' || e.key === 'Esc')) {
        setSearchOpen(false);
        // Return focus to the toggle button
        const openBtn = qs('.js-search-toggle:not(.site-search__close)');
        if (openBtn) openBtn.focus();
      }
    });
  })();

  /* ─────────────────────────────────────────────────────────────────────────
     3. Mobile Drawer
     ───────────────────────────────────────────────────────────────────────── */
  (function initDrawer() {
    const hamburger  = qs('#hamburger-btn');
    const drawer     = qs('#nav-drawer');
    const overlay    = qs('#nav-overlay');
    const closeBtn   = qs('#drawer-close-btn');

    if (!hamburger || !drawer) return;

    let isOpen          = false;
    let previousFocus   = null; // element to restore focus to on close
    let scrollbarWidth  = 0;

    /* ── Scroll lock helpers ─────────────────────────────────────────────── */

    /**
     * Calculate the scrollbar width once and cache it.
     * Adds padding-right to body equal to scrollbar width to prevent
     * layout shift when overflow:hidden removes the scrollbar.
     */
    function getScrollbarWidth() {
      return window.innerWidth - document.documentElement.clientWidth;
    }

    function lockBodyScroll() {
      scrollbarWidth = getScrollbarWidth();
      document.body.style.overflow         = 'hidden';
      // Compensate for removed scrollbar to prevent content jump
      document.body.style.paddingRight     = scrollbarWidth + 'px';
      // Also offset the fixed header so it doesn't shift
      const header = qs('#site-header');
      if (header) header.style.paddingRight = scrollbarWidth + 'px';
    }

    function unlockBodyScroll() {
      document.body.style.overflow         = '';
      document.body.style.paddingRight     = '';
      const header = qs('#site-header');
      if (header) header.style.paddingRight = '';
    }

    /* ── Focus trap ──────────────────────────────────────────────────────── */

    /**
     * Trap Tab / Shift+Tab focus within the drawer while it is open.
     * @param {KeyboardEvent} e
     */
    function trapFocus(e) {
      if (e.key !== 'Tab') return;

      const focusable = getFocusable(drawer);
      if (focusable.length === 0) return;

      const firstEl = focusable[0];
      const lastEl  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: wrap from first → last
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        // Tab: wrap from last → first
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }

    /* ── Open / close ────────────────────────────────────────────────────── */

    /**
     * @param {boolean} open
     */
    function setDrawerOpen(open) {
      isOpen = open;

      if (open) {
        // Remember what was focused before opening
        previousFocus = document.activeElement;

        drawer.classList.add('is-open');
        drawer.setAttribute('aria-hidden', 'false');
        drawer.removeAttribute('hidden');
        hamburger.setAttribute('aria-expanded', 'true');

        if (overlay) {
          overlay.classList.add('is-visible');
          overlay.setAttribute('aria-hidden', 'true'); // Overlay itself not interactive content
        }

        lockBodyScroll();

        // Move focus into drawer — close button is first focusable element
        setTimeout(function () {
          const firstFocusable = getFocusable(drawer)[0];
          if (firstFocusable) firstFocusable.focus();
        }, 50);

        // Bind focus trap and Escape key
        document.addEventListener('keydown', handleDrawerKeydown);

      } else {
        drawer.classList.remove('is-open');
        drawer.setAttribute('aria-hidden', 'true');
        hamburger.setAttribute('aria-expanded', 'false');

        if (overlay) overlay.classList.remove('is-visible');

        unlockBodyScroll();

        // Remove focus trap listener
        document.removeEventListener('keydown', handleDrawerKeydown);

        // Restore focus to the element that opened the drawer
        if (previousFocus) {
          previousFocus.focus();
          previousFocus = null;
        }
      }
    }

    /**
     * Keyboard handler active only while drawer is open.
     * @param {KeyboardEvent} e
     */
    function handleDrawerKeydown(e) {
      if (e.key === 'Escape' || e.key === 'Esc') {
        setDrawerOpen(false);
        return;
      }
      trapFocus(e);
    }

    /* ── Event wiring ────────────────────────────────────────────────────── */

    hamburger.addEventListener('click', function () {
      setDrawerOpen(!isOpen);
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        setDrawerOpen(false);
      });
    }

    // Click on overlay closes drawer
    if (overlay) {
      overlay.addEventListener('click', function () {
        setDrawerOpen(false);
      });
    }

    // Clicking a drawer nav link also closes drawer (single-page or normal nav)
    const drawerLinks = qsa('.nav-drawer__link, .nav-drawer__util', drawer);
    drawerLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        setDrawerOpen(false);
      });
    });
  })();

  /* ─────────────────────────────────────────────────────────────────────────
     4. Cart Count — Live Update via Shopify Cart API
     ───────────────────────────────────────────────────────────────────────── */
  (function initCartCount() {
    const badge       = qs('#cart-count');
    const cartLink    = qs('#cart-icon-link');

    if (!badge) return;

    /**
     * Fetch /cart.js and update the count badge.
     * Called on page load, and after any cart mutation event.
     */
    function updateCartCount() {
      fetch('/cart.js', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Cart fetch failed: ' + res.status);
          return res.json();
        })
        .then(function (cart) {
          const count = cart.item_count || 0;
          badge.textContent = count;

          if (count === 0) {
            badge.classList.add('is-hidden');
          } else {
            badge.classList.remove('is-hidden');
          }

          // Update aria-label on cart link for screen readers
          if (cartLink) {
            const label = count === 0
              ? 'Cart'
              : 'Cart, ' + count + ' item' + (count !== 1 ? 's' : '');
            cartLink.setAttribute('aria-label', label);
          }
        })
        .catch(function (err) {
          // Silent fail — badge retains server-rendered value
          console.warn('[Saanjh Header] Cart update error:', err);
        });
    }

    // Run on load
    updateCartCount();

    /**
     * Listen for custom 'cart:updated' event dispatched by other theme scripts
     * (e.g. quick-add, cart drawer) after adding/removing items.
     */
    document.addEventListener('cart:updated', updateCartCount);

    /**
     * Also respond to Shopify's Section Events if cart section renders
     */
    document.addEventListener('cart:refresh', updateCartCount);
  })();

  /* ─────────────────────────────────────────────────────────────────────────
     5. Announcement Bar Dismiss
     ───────────────────────────────────────────────────────────────────────── */
  (function initAnnouncement() {
    const bar      = qs('#announcement-bar');
    const closeBtn = qs('[data-announce-close]');

    if (!bar || !closeBtn) return;

    // Check if user has already dismissed this session
    const SESSION_KEY = 'saanjh_announce_dismissed';
    if (sessionStorage.getItem(SESSION_KEY) === '1') {
      bar.hidden = true;
      return;
    }

    closeBtn.addEventListener('click', function () {
      // Animate out
      bar.style.maxHeight = bar.offsetHeight + 'px';
      bar.style.overflow  = 'hidden';
      bar.style.transition = 'max-height 300ms ease, opacity 300ms ease';

      requestAnimationFrame(function () {
        bar.style.maxHeight = '0';
        bar.style.opacity   = '0';
      });

      bar.addEventListener('transitionend', function onEnd() {
        bar.removeEventListener('transitionend', onEnd);
        bar.hidden = true;
        bar.style.cssText = '';
      });

      // Persist dismissal for this browser session
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch (e) {
        // sessionStorage not available — ignore
      }
    });
  })();

})(); // End IIFE
