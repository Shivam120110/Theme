/**
 * product.js
 * Saanjh Shopify Theme — Product page JS
 *
 * Responsibilities:
 *   1. Thumbnail → main image swap
 *   2. Hover zoom (CSS class toggle)
 *   3. Variant selection → price update + form input sync
 *   4. Quantity stepper (+/-)
 *   5. Accordion open/close (animation hook)
 *   6. 360° embed tab show/hide
 *   7. Add-to-cart via Shopify AJAX Cart API
 *   8. Share — copy link to clipboard
 */

(function () {
  'use strict';

  /* ─── Selectors ─────────────────────────────────────────────────────────── */
  const SEL = {
    /* Media */
    mediaSection:     '[data-product-media]',
    mediaMainWrap:    '[data-media-main-wrap]',
    mediaMainImage:   '[data-media-main-image]',
    mediaThumbs:      '[data-media-thumbs]',
    mediaThumb:       '[data-media-thumb]',
    mediaTab:         '[data-media-tab]',
    mediaPanel:       '[data-media-panel]',
    zoomHint:         '[data-zoom-hint]',

    /* Info / Form */
    productJson:      '[data-product-json]',
    productForm:      '[data-product-form]',
    variantId:        '[data-variant-id]',
    variantGroup:     '[data-variant-group]',
    optionInput:      '[data-option-input]',
    optionSelected:   '[data-option-selected]',
    optionLabel:      '[data-option-label]',
    priceBlock:       '[data-price-block]',
    productPrice:     '[data-product-price]',
    comparePrice:     '[data-compare-price]',

    /* Quantity */
    qtyWrapper:       '[data-quantity-wrapper]',
    qtyMinus:         '[data-qty-minus]',
    qtyPlus:          '[data-qty-plus]',
    qtyInput:         '[data-qty-input]',

    /* Cart */
    addToCartBtn:     '[data-add-to-cart]',
    addToCartText:    '[data-add-to-cart-text]',
    cartLoader:       '[data-cart-loader]',
    cartFeedback:     '[data-cart-feedback]',

    /* Accordions */
    accordion:        '[data-accordion]',

    /* Share */
    copyLink:         '[data-copy-link]',
  };

  /* ─── State ──────────────────────────────────────────────────────────────── */
  let productData       = null;   // Full product JSON from Liquid
  let selectedOptions   = [];     // Current option values array

  /* ─── Utility ────────────────────────────────────────────────────────────── */

  /** Format a price integer (cents) to ₹ display string */
  function formatMoney(cents) {
    if (cents === null || cents === undefined) return '';
    const amount = (cents / 100).toFixed(2);
    // Remove trailing ".00" for whole rupee amounts
    const trimmed = amount.endsWith('.00') ? amount.slice(0, -3) : amount;
    return `₹${Number(trimmed).toLocaleString('en-IN')}`;
  }

  /**
   * Find the variant that matches the current selectedOptions array.
   * @returns {object|null}
   */
  function findVariant() {
    if (!productData) return null;
    return productData.variants.find((v) =>
      v.options.every((opt, i) => opt === selectedOptions[i])
    ) || null;
  }

  /* ─── 1 & 2. Media Gallery — Thumbnails + Zoom ───────────────────────────── */
  function initMediaGallery() {
    const mediaSection = document.querySelector(SEL.mediaSection);
    if (!mediaSection) return;

    const mainWrap   = mediaSection.querySelector(SEL.mediaMainWrap);
    const mainImages = mediaSection.querySelectorAll(SEL.mediaMainImage);
    const thumbs     = mediaSection.querySelectorAll(SEL.mediaThumb);
    const enableZoom = mediaSection.dataset.enableZoom === 'true';

    /* ── Thumbnail click → swap active main image ── */
    thumbs.forEach((thumb) => {
      thumb.addEventListener('click', () => {
        const targetId = thumb.dataset.mediaId;
        activateMainImage(targetId, mainImages, thumbs, thumb);
      });

      /* Keyboard: Enter / Space */
      thumb.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          thumb.click();
        }
      });
    });

    /**
     * Show the main image matching mediaId, update thumb states.
     * @param {string} mediaId
     * @param {NodeList} allImages
     * @param {NodeList} allThumbs
     * @param {HTMLElement} activeThumb
     */
    function activateMainImage(mediaId, allImages, allThumbs, activeThumb) {
      allImages.forEach((img) => {
        const isTarget = img.dataset.mediaId === mediaId;
        img.classList.toggle('product-media__main-image--active', isTarget);
        img.setAttribute('aria-hidden', isTarget ? 'false' : 'true');
      });

      allThumbs.forEach((t) => {
        const isActive = t === activeThumb;
        t.classList.toggle('product-media__thumb--active', isActive);
        t.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });

      // Scroll active thumb into view (smooth)
      if (activeThumb) {
        activeThumb.scrollIntoView({
          behavior: 'smooth',
          block:    'nearest',
          inline:   'nearest',
        });
      }
    }

    /* ── Hover Zoom ── */
    if (enableZoom && mainWrap) {
      let hintDismissed = false;

      mainWrap.addEventListener('mouseenter', () => {
        mainWrap.classList.add('is-zoomed');
        if (!hintDismissed) {
          mainWrap.classList.add('hint-dismissed');
          hintDismissed = true;
        }
      });

      mainWrap.addEventListener('mouseleave', () => {
        mainWrap.classList.remove('is-zoomed');
      });

      /* Touch devices: single tap to toggle zoom */
      mainWrap.addEventListener('click', () => {
        mainWrap.classList.toggle('is-zoomed');
      });
    }
  }

  /* ─── 6. Media Tabs (Photos / 360°) ─────────────────────────────────────── */
  function initMediaTabs() {
    const tabs   = document.querySelectorAll(SEL.mediaTab);
    const panels = document.querySelectorAll(SEL.mediaPanel);

    if (!tabs.length) return;

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const targetPanel = tab.dataset.mediaTab;

        // Update tab states
        tabs.forEach((t) => {
          const isSelected = t === tab;
          t.classList.toggle('product-media__tab--active', isSelected);
          t.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        });

        // Show/hide panels
        panels.forEach((panel) => {
          const isVisible = panel.dataset.mediaPanel === targetPanel;
          panel.classList.toggle('product-media__panel--hidden', !isVisible);
        });
      });
    });
  }

  /* ─── 3. Variant Selection → Price Update ────────────────────────────────── */
  function initVariantSelectors() {
    const productJsonEl = document.querySelector(SEL.productJson);
    if (!productJsonEl) return;

    try {
      productData = JSON.parse(productJsonEl.textContent);
    } catch (err) {
      console.warn('[Saanjh] Could not parse product JSON.', err);
      return;
    }

    // Build initial selectedOptions from checked inputs
    const optionInputs = document.querySelectorAll(SEL.optionInput);
    if (!optionInputs.length) return;

    // Determine number of options
    const optionPositions = new Set(
      [...optionInputs].map((inp) => parseInt(inp.dataset.optionPosition, 10))
    );
    const numOptions = optionPositions.size;
    selectedOptions = new Array(numOptions).fill('');

    // Populate from checked inputs
    optionInputs.forEach((input) => {
      if (input.checked) {
        const pos = parseInt(input.dataset.optionPosition, 10) - 1;
        selectedOptions[pos] = input.value;
      }
    });

    /* Listen for option changes */
    optionInputs.forEach((input) => {
      input.addEventListener('change', () => {
        const pos = parseInt(input.dataset.optionPosition, 10) - 1;
        selectedOptions[pos] = input.value;

        // Update selected label text
        const selectedDisplay = document.querySelector(
          `[data-option-selected="${input.dataset.optionPosition}"]`
        );
        if (selectedDisplay) selectedDisplay.textContent = input.value;

        // Update visual selected class on sibling labels
        const group = input.closest(SEL.variantGroup)
          || input.closest('[data-variant-group]');
        if (group) {
          group.querySelectorAll(SEL.optionLabel).forEach((label) => {
            const labelInput = label.querySelector(SEL.optionInput);
            label.classList.toggle(
              'variant-option--selected',
              labelInput && labelInput.checked
            );
          });
        }

        // Find matching variant and update UI
        const variant = findVariant();
        updatePriceBlock(variant);
        updateVariantInput(variant);
        updateAddToCartState(variant);
      });
    });
  }

  /**
   * Update displayed price + compare-at price.
   * @param {object|null} variant
   */
  function updatePriceBlock(variant) {
    const priceEl   = document.querySelector(SEL.productPrice);
    const compareEl = document.querySelector(SEL.comparePrice);

    if (!priceEl) return;

    if (!variant) {
      priceEl.textContent = '—';
      if (compareEl) {
        compareEl.innerHTML = '';
        compareEl.classList.add('product-info__compare-price--hidden');
      }
      return;
    }

    priceEl.textContent = formatMoney(variant.price);
    priceEl.classList.toggle(
      'product-info__price--on-sale',
      variant.compare_at_price > variant.price
    );

    if (compareEl) {
      if (variant.compare_at_price && variant.compare_at_price > variant.price) {
        compareEl.innerHTML = `<s>${formatMoney(variant.compare_at_price)}</s>`;
        compareEl.classList.remove('product-info__compare-price--hidden');
        compareEl.setAttribute('aria-hidden', 'false');
      } else {
        compareEl.innerHTML = '';
        compareEl.classList.add('product-info__compare-price--hidden');
        compareEl.setAttribute('aria-hidden', 'true');
      }
    }
  }

  /** Update the hidden variant ID input (used in the form) */
  function updateVariantInput(variant) {
    const variantInput = document.querySelector(SEL.variantId);
    if (variantInput && variant) {
      variantInput.value = variant.id;
    }
  }

  /** Enable / disable the Add to Bag button based on availability */
  function updateAddToCartState(variant) {
    const btn     = document.querySelector(SEL.addToCartBtn);
    const btnText = document.querySelector(SEL.addToCartText);
    if (!btn) return;

    if (!variant) {
      btn.disabled = true;
      btn.setAttribute('aria-disabled', 'true');
      if (btnText) btnText.textContent = 'Unavailable';
    } else if (!variant.available) {
      btn.disabled = true;
      btn.setAttribute('aria-disabled', 'true');
      if (btnText) btnText.textContent = 'Sold Out';
    } else {
      btn.disabled = false;
      btn.removeAttribute('aria-disabled');
      if (btnText) btnText.textContent = 'Add to Bag';
    }
  }

  /* ─── 4. Quantity Stepper ────────────────────────────────────────────────── */
  function initQuantityStepper() {
    const minusBtn  = document.querySelector(SEL.qtyMinus);
    const plusBtn   = document.querySelector(SEL.qtyPlus);
    const qtyInput  = document.querySelector(SEL.qtyInput);

    if (!minusBtn || !plusBtn || !qtyInput) return;

    function clampValue(val) {
      const min = parseInt(qtyInput.min, 10) || 1;
      const max = parseInt(qtyInput.max, 10) || 999;
      return Math.min(Math.max(val, min), max);
    }

    minusBtn.addEventListener('click', () => {
      const current = parseInt(qtyInput.value, 10) || 1;
      qtyInput.value = clampValue(current - 1);
      qtyInput.dispatchEvent(new Event('change'));
    });

    plusBtn.addEventListener('click', () => {
      const current = parseInt(qtyInput.value, 10) || 1;
      qtyInput.value = clampValue(current + 1);
      qtyInput.dispatchEvent(new Event('change'));
    });

    qtyInput.addEventListener('change', () => {
      const val = parseInt(qtyInput.value, 10);
      if (isNaN(val)) qtyInput.value = 1;
      else qtyInput.value = clampValue(val);
    });
  }

  /* ─── 5. Accordions ──────────────────────────────────────────────────────── */
  /**
   * <details> handles toggle natively.
   * We hook in only to animate max-height for smooth open/close.
   */
  function initAccordions() {
    document.querySelectorAll(SEL.accordion).forEach((details) => {
      const body = details.querySelector('.product-accordion__body');
      if (!body) return;

      details.addEventListener('toggle', () => {
        // Trigger re-animation by removing and re-adding element
        if (details.open) {
          body.style.animation = 'none';
          // Force reflow
          void body.offsetWidth;
          body.style.animation = '';
        }
      });
    });
  }

  /* ─── 7. Add to Cart (AJAX) ──────────────────────────────────────────────── */
  function initAddToCart() {
    const form      = document.querySelector(SEL.productForm);
    const btn       = document.querySelector(SEL.addToCartBtn);
    const btnText   = document.querySelector(SEL.addToCartText);
    const loader    = document.querySelector(SEL.cartLoader);
    const feedback  = document.querySelector(SEL.cartFeedback);

    if (!form || !btn) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (btn.disabled || btn.getAttribute('aria-disabled') === 'true') return;

      const variantId = document.querySelector(SEL.variantId)?.value;
      const quantity  = parseInt(
        document.querySelector(SEL.qtyInput)?.value || '1',
        10
      );

      if (!variantId) return;

      /* ── Loading state ── */
      btn.classList.add('is-loading');
      btn.setAttribute('aria-busy', 'true');
      if (btnText) btnText.textContent = 'Adding…';
      if (feedback) {
        feedback.textContent = '';
        feedback.className = 'product-actions__feedback';
      }

      try {
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: JSON.stringify({
            id:       parseInt(variantId, 10),
            quantity: quantity,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.description || 'Could not add to bag.');
        }

        /* Success */
        if (btnText) btnText.textContent = 'Added to Bag ✓';
        if (feedback) {
          feedback.textContent = 'Your piece is in the bag.';
          feedback.classList.add('is-success');
        }

        /* Update cart count bubble if present in the DOM */
        updateCartCount();

        /* Reset button text after a moment */
        setTimeout(() => {
          if (btnText) btnText.textContent = 'Add to Bag';
          if (feedback) {
            feedback.textContent = '';
            feedback.className = 'product-actions__feedback';
          }
        }, 3000);

      } catch (err) {
        console.warn('[Saanjh] Add to cart error:', err.message);
        if (btnText) btnText.textContent = 'Add to Bag';
        if (feedback) {
          feedback.textContent = err.message || 'Something went wrong. Please try again.';
          feedback.classList.add('is-error');
        }

        setTimeout(() => {
          if (feedback) {
            feedback.textContent = '';
            feedback.className = 'product-actions__feedback';
          }
        }, 4000);

      } finally {
        btn.classList.remove('is-loading');
        btn.removeAttribute('aria-busy');
      }
    });
  }

  /**
   * Fetch the cart and update any cart-count elements in the DOM.
   * Looks for [data-cart-count] and [data-cart-bubble].
   */
  async function updateCartCount() {
    try {
      const res  = await fetch('/cart.js', {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      const cart = await res.json();
      const count = cart.item_count;

      document.querySelectorAll('[data-cart-count]').forEach((el) => {
        el.textContent = count;
      });

      document.querySelectorAll('[data-cart-bubble]').forEach((el) => {
        el.style.display = count > 0 ? '' : 'none';
        el.textContent   = count;
      });
    } catch {
      /* Silent — cart count update is non-critical */
    }
  }

  /* ─── 8. Copy Link ───────────────────────────────────────────────────────── */
  function initCopyLink() {
    document.querySelectorAll(SEL.copyLink).forEach((btn) => {
      btn.addEventListener('click', async () => {
        const url = btn.dataset.url || window.location.href;
        try {
          await navigator.clipboard.writeText(url);
          const original = btn.getAttribute('aria-label');
          btn.setAttribute('aria-label', 'Link copied!');
          btn.title = 'Link copied!';
          setTimeout(() => {
            btn.setAttribute('aria-label', original);
            btn.title = '';
          }, 2000);
        } catch {
          /* Fallback for older browsers */
          const tempInput = document.createElement('input');
          tempInput.value = url;
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          document.body.removeChild(tempInput);
        }
      });
    });
  }

  /* ─── Init ───────────────────────────────────────────────────────────────── */
  function init() {
    initMediaGallery();
    initMediaTabs();
    initVariantSelectors();
    initQuantityStepper();
    initAccordions();
    initAddToCart();
    initCopyLink();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
