/* ══════════════════════════════════════════════════════════════════════════
   BOSS BRAND — Main JavaScript
   ══════════════════════════════════════════════════════════════════════════ */

(function() {
    'use strict';

    // ── Cart (localStorage) ─────────────────────────────────────────────
    const Cart = {
        KEY: 'boss_cart',

        getItems: function() {
            try { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); }
            catch(e) { return []; }
        },

        saveItems: function(items) {
            localStorage.setItem(this.KEY, JSON.stringify(items));
            this.updateCount();
        },

        addItem: function(product) {
            var items = this.getItems();
            var existing = items.find(function(i) { return i.slug === product.slug; });
            if (!existing) {
                items.push({
                    name: product.name,
                    slug: product.slug,
                    price: parseFloat(product.price),
                    image: product.image || ''
                });
                this.saveItems(items);
                showToast('Added to cart: ' + product.name);
            } else {
                showToast('Already in cart');
            }
        },

        removeItem: function(slug) {
            var items = this.getItems().filter(function(i) { return i.slug !== slug; });
            this.saveItems(items);
        },

        getTotal: function() {
            return this.getItems().reduce(function(sum, i) { return sum + i.price; }, 0);
        },

        clear: function() {
            localStorage.removeItem(this.KEY);
            this.updateCount();
        },

        updateCount: function() {
            var counts = document.querySelectorAll('.cart-count');
            var n = this.getItems().length;
            counts.forEach(function(el) { el.textContent = n; });
        }
    };

    // ── Toast Notification ──────────────────────────────────────────────
    function showToast(message) {
        var existing = document.querySelector('.toast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(function() { toast.classList.add('show'); }, 10);
        setTimeout(function() {
            toast.classList.remove('show');
            setTimeout(function() { toast.remove(); }, 400);
        }, 3000);
    }
    window.showToast = showToast;

    // ── Navbar Scroll Effect ────────────────────────────────────────────
    var navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // ── Mobile Menu Toggle ──────────────────────────────────────────────
    var navToggle = document.getElementById('navToggle');
    var navMenu = document.getElementById('navMenu');
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        // Close menu on link click
        navMenu.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', function() {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // ── Smooth Scrolling ────────────────────────────────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            var target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ── Add to Cart Buttons ─────────────────────────────────────────────
    document.querySelectorAll('.add-to-cart-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            Cart.addItem({
                name: this.dataset.name,
                slug: this.dataset.slug,
                price: this.dataset.price,
                image: this.dataset.image
            });
        });
    });

    // ── "Buy Now" URL param handling ────────────────────────────────────
    var urlParams = new URLSearchParams(window.location.search);
    var buySlug = urlParams.get('buy');
    if (buySlug) {
        // If arriving via "Buy Now" and product not in cart, it will be
        // shown automatically via the checkout rendering below.
    }

    // ── Checkout Page Rendering ─────────────────────────────────────────
    var checkoutItems = document.getElementById('checkoutItems');
    if (checkoutItems) {
        renderCheckout();
    }

    function renderCheckout() {
        var items = Cart.getItems();
        var checkoutItemsEl = document.getElementById('checkoutItems');
        var checkoutTotal = document.getElementById('checkoutTotal');
        var emptyCart = document.getElementById('emptyCart');
        var subtotal = document.getElementById('subtotalAmount');
        var total = document.getElementById('totalAmount');

        if (!checkoutItemsEl) return;

        if (items.length === 0) {
            if (emptyCart) emptyCart.style.display = 'block';
            if (checkoutTotal) checkoutTotal.style.display = 'none';
            return;
        }

        if (emptyCart) emptyCart.style.display = 'none';
        if (checkoutTotal) checkoutTotal.style.display = 'block';

        var html = '';
        items.forEach(function(item) {
            html += '<div class="checkout-item">' +
                '<div class="checkout-item-info">' +
                '<strong>' + item.name + '</strong>' +
                '<span style="margin-left:12px;color:var(--accent);">$' + item.price.toFixed(2) + '</span>' +
                '</div>' +
                '<button class="checkout-item-remove" data-slug="' + item.slug + '" title="Remove">&times;</button>' +
                '</div>';
        });
        checkoutItemsEl.innerHTML = html;

        var cartTotal = Cart.getTotal();
        if (subtotal) subtotal.textContent = '$' + cartTotal.toFixed(2);
        if (total) total.textContent = '$' + cartTotal.toFixed(2);

        // Remove buttons
        checkoutItemsEl.querySelectorAll('.checkout-item-remove').forEach(function(btn) {
            btn.addEventListener('click', function() {
                Cart.removeItem(this.dataset.slug);
                renderCheckout();
            });
        });
    }

    // ── Copy Wallet Address ─────────────────────────────────────────────
    window.copyAddress = function() {
        var addr = document.getElementById('walletAddress');
        if (!addr) return;
        var text = addr.textContent.trim();
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(function() {
                showToast('Wallet address copied!');
            });
        } else {
            // Fallback
            var ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showToast('Wallet address copied!');
        }
    };

    // ── Confirm Payment ─────────────────────────────────────────────────
    window.confirmPayment = function() {
        var email = document.getElementById('buyerEmail');
        var downloadArea = document.getElementById('downloadArea');
        var downloadLinks = document.getElementById('downloadLinks');

        if (email && !email.value) {
            showToast('Please enter your email for the receipt.');
            email.focus();
            return;
        }

        if (downloadArea) {
            downloadArea.style.display = 'block';
        }

        // Generate download links for cart items
        var items = Cart.getItems();
        if (downloadLinks && items.length > 0) {
            var html = '';
            items.forEach(function(item) {
                html += '<a href="/products/' + item.slug + '/download" class="download-link">' +
                    'Download ' + item.name + '</a>';
            });
            downloadLinks.innerHTML = html;
        }

        // Scroll to download area
        if (downloadArea) {
            downloadArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        showToast('Payment confirmed! Your downloads are ready.');
        Cart.clear();
        renderCheckout();
    };

    // ── Product Filter (Products Page) ──────────────────────────────────
    document.querySelectorAll('.filter-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');

            var filter = this.dataset.filter;
            document.querySelectorAll('.product-card[data-category]').forEach(function(card) {
                if (filter === 'all' || card.dataset.category === filter) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // ── Email Form (Formspree fallback) ─────────────────────────────────
    document.querySelectorAll('form[action="#"]').forEach(function(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var input = this.querySelector('input[type="email"]');
            if (input && input.value) {
                // Store locally as backup
                var emails = [];
                try { emails = JSON.parse(localStorage.getItem('captured_emails') || '[]'); } catch(x) {}
                emails.push({ email: input.value, timestamp: new Date().toISOString() });
                localStorage.setItem('captured_emails', JSON.stringify(emails));
                input.value = '';
                showToast('Thanks for subscribing!');
            }
        });
    });

    // ── Init ────────────────────────────────────────────────────────────
    Cart.updateCount();

})();
