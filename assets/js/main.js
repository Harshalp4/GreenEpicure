/* ============================================
   GREEN EPICURE - Premium JavaScript
   GSAP Animations & Interactions
   ============================================ */

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
    initPreloader();
    initCustomCursor();
    initHeader();
    initMobileMenu();
    initHeroVideo();
    initHeroAnimations();
    initScrollAnimations();
    initProducts();
    initProductCarousel();
    initCategoryShowcase();
    initParallaxGallery();
    initProductMarquee();
    initTestimonials();
    initCounters();
    initContactForm();
});

/* ============================================
   Hero Video - Mobile Autoplay Fix
   ============================================ */
function initHeroVideo() {
    const video = document.querySelector('.hero-video-bg');
    if (!video) return;

    // Ensure video plays on mobile
    function playVideo() {
        if (video.paused) {
            video.play().catch(() => {
                // Silent fail - video may not autoplay on some devices
            });
        }
    }

    // Try to play immediately
    playVideo();

    // Also try on window load
    window.addEventListener('load', playVideo);

    // Try on first user interaction (for stricter browsers)
    const playOnInteraction = () => {
        playVideo();
        document.removeEventListener('touchstart', playOnInteraction);
        document.removeEventListener('click', playOnInteraction);
    };
    document.addEventListener('touchstart', playOnInteraction, { passive: true });
    document.addEventListener('click', playOnInteraction);

    // Ensure video restarts if it ends (backup for loop attribute)
    video.addEventListener('ended', () => {
        video.currentTime = 0;
        video.play();
    });
}

/* ============================================
   Preloader
   ============================================ */
function initPreloader() {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;

    window.addEventListener('load', () => {
        gsap.to(preloader, {
            opacity: 0,
            duration: 0.5,
            delay: 0.5,
            onComplete: () => {
                preloader.classList.add('hidden');
                document.body.style.overflow = '';
            }
        });
    });
}

/* ============================================
   Custom Cursor
   ============================================ */
function initCustomCursor() {
    const cursor = document.querySelector('.custom-cursor');
    const follower = document.querySelector('.cursor-follower');

    if (!cursor || !follower) return;

    // Check for touch device
    if ('ontouchstart' in window) {
        cursor.style.display = 'none';
        follower.style.display = 'none';
        return;
    }

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    let followerX = 0, followerY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Smooth cursor animation
    function animateCursor() {
        cursorX += (mouseX - cursorX) * 0.2;
        cursorY += (mouseY - cursorY) * 0.2;
        followerX += (mouseX - followerX) * 0.1;
        followerY += (mouseY - followerY) * 0.1;

        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';
        follower.style.left = followerX + 'px';
        follower.style.top = followerY + 'px';

        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Hover effects
    const hoverElements = document.querySelectorAll('a, button, .product-card');
    hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('hover');
            follower.classList.add('hover');
        });
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('hover');
            follower.classList.remove('hover');
        });
    });
}

/* ============================================
   Header
   ============================================ */
function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;

    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });
}

/* ============================================
   Mobile Menu
   ============================================ */
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const nav = document.getElementById('nav');

    if (!menuToggle || !nav) return;

    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        nav.classList.toggle('active');
        document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
    });

    // Close on link click
    nav.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            nav.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && nav.classList.contains('active')) {
            menuToggle.classList.remove('active');
            nav.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

/* ============================================
   Hero Animations
   ============================================ */
function initHeroAnimations() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Text animations
    tl.to('.hero-badge', {
        opacity: 1,
        y: 0,
        duration: 0.6,
        delay: 0.3
    })
    .to('.hero-title', {
        opacity: 1,
        y: 0,
        duration: 0.8
    }, '-=0.3')
    .to('.hero-subtitle', {
        opacity: 1,
        y: 0,
        duration: 0.6
    }, '-=0.4')
    .to('.hero-cta', {
        opacity: 1,
        y: 0,
        duration: 0.6
    }, '-=0.3');

    // Hero categories wrapper animation
    const categoriesLabel = document.querySelector('.hero-categories-label');
    if (categoriesLabel) {
        tl.fromTo(categoriesLabel,
            { opacity: 0, x: 20 },
            { opacity: 1, x: 0, duration: 0.5 },
            '-=0.2'
        );
    }

    // Hero category cards animation
    const heroCategories = document.querySelectorAll('.hero-category-card');
    if (heroCategories.length) {
        heroCategories.forEach((card, i) => {
            tl.fromTo(card,
                { opacity: 0, x: 60, scale: 0.98 },
                { opacity: 1, x: 0, scale: 1, duration: 0.5, ease: 'power2.out' },
                `-=${i === 0 ? 0.2 : 0.35}`
            );
        });
    }

    // Hero products grid animation (legacy)
    const heroProducts = document.querySelectorAll('.hero-product');
    if (heroProducts.length) {
        heroProducts.forEach((product, i) => {
            tl.to(product, {
                opacity: 1,
                y: 0,
                duration: 0.5,
                delay: i * 0.1
            }, '-=0.3');
        });
    }

    // Stats bar animation
    tl.to('.hero-stats-bar, .hero-stats', {
        opacity: 1,
        y: 0,
        duration: 0.6
    }, '-=0.2');
}

/* ============================================
   Scroll Animations
   ============================================ */
function initScrollAnimations() {
    // Section headers
    gsap.utils.toArray('.section-header').forEach(header => {
        gsap.from(header.children, {
            scrollTrigger: {
                trigger: header,
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            opacity: 0,
            y: 30,
            duration: 0.8,
            stagger: 0.15
        });
    });

    // Feature cards
    gsap.utils.toArray('.feature-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            },
            opacity: 0,
            y: 40,
            duration: 0.6,
            delay: i * 0.1
        });
    });

    // About section
    const aboutContent = document.querySelector('.about-content');
    const aboutImage = document.querySelector('.about-image');

    if (aboutContent) {
        gsap.from(aboutContent, {
            scrollTrigger: {
                trigger: aboutContent,
                start: 'top 70%',
                toggleActions: 'play none none reverse'
            },
            opacity: 0,
            x: 50,
            duration: 1
        });
    }

    if (aboutImage) {
        gsap.from(aboutImage, {
            scrollTrigger: {
                trigger: aboutImage,
                start: 'top 70%',
                toggleActions: 'play none none reverse'
            },
            opacity: 0,
            x: -50,
            duration: 1
        });
    }

    // CTA section
    const ctaContent = document.querySelector('.cta-content');
    if (ctaContent) {
        gsap.from(ctaContent.children, {
            scrollTrigger: {
                trigger: ctaContent,
                start: 'top 75%',
                toggleActions: 'play none none reverse'
            },
            opacity: 0,
            y: 30,
            duration: 0.8,
            stagger: 0.15
        });
    }

    // Certification items
    gsap.utils.toArray('.cert-item').forEach((item, i) => {
        gsap.from(item, {
            scrollTrigger: {
                trigger: item.parentElement,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            },
            opacity: 0,
            y: 20,
            duration: 0.5,
            delay: i * 0.1
        });
    });

    // Value cards (about page)
    gsap.utils.toArray('.value-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            },
            opacity: 0,
            y: 40,
            duration: 0.6,
            delay: i * 0.1
        });
    });

    // Process steps
    gsap.utils.toArray('.process-step').forEach((step, i) => {
        gsap.from(step, {
            scrollTrigger: {
                trigger: step,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            },
            opacity: 0,
            y: 40,
            duration: 0.6,
            delay: i * 0.15
        });
    });

    // Number cards
    gsap.utils.toArray('.number-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card.parentElement,
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            opacity: 0,
            y: 30,
            duration: 0.6,
            delay: i * 0.1
        });
    });

    // FAQ cards
    gsap.utils.toArray('.faq-item-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card.parentElement,
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            opacity: 0,
            y: 30,
            duration: 0.6,
            delay: i * 0.1
        });
    });
}

/* ============================================
   Products
   ============================================ */
let allProducts = []; // Store fetched products

async function initProducts() {
    const productsGrid = document.getElementById('productsGrid');
    const productsGridFull = document.getElementById('productsGridFull');
    const filterBtns = document.querySelectorAll('.filter-btn');

    if (productsGrid || productsGridFull) {
        // Fetch products from API
        await fetchProducts();

        // Initial render
        renderProducts('all', productsGrid || productsGridFull);

        // Filter click handlers
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filter = btn.dataset.filter;
                renderProducts(filter, productsGrid || productsGridFull);
            });
        });
    }
}

async function fetchProducts() {
    try {
        const response = await fetch('/api/products');
        const data = await response.json();
        if (data.products && data.products.length > 0) {
            // Map database products to expected format
            allProducts = data.products.map(p => ({
                id: p.id,
                name: p.name,
                category: p.category,
                description: p.description,
                certifications: Array.isArray(p.certifications)
                    ? p.certifications
                    : (p.certifications ? p.certifications.split(',').map(s => s.trim()) : ['Organic']),
                image: p.image_url || 'assets/images/products/default.jpg',
                featured: p.featured,
                price: p.display_price || p.price,
                unit: p.unit || 'kg',
                minOrder: `${p.moq || 1} ${p.unit || 'kg'}`,
                moq: p.moq || 1,
                in_stock: p.in_stock
            }));
            // Update global PRODUCTS for cart compatibility
            window.PRODUCTS = allProducts;
        } else {
            // Fallback to static products if API returns empty
            allProducts = PRODUCTS;
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        // Fallback to static products on error
        allProducts = PRODUCTS;
    }
}

function renderProducts(filter, container) {
    if (!container) return;

    const products = filter === 'all' ? allProducts : allProducts.filter(p => p.category === filter);

    // Animate out
    gsap.to('.product-card', {
        opacity: 0,
        y: 20,
        duration: 0.3,
        stagger: 0.05,
        onComplete: () => {
            // Render
            container.innerHTML = products.map(product => createProductCard(product)).join('');

            // Animate in
            gsap.fromTo('.product-card',
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out' }
            );
        }
    });
}

function createProductCard(product) {
    const badges = product.certifications.slice(0, 2).map(cert =>
        `<span class="product-badge">${cert}</span>`
    ).join('');

    const price = product.price ? `₹${product.price.toLocaleString()}` : '';
    const unit = product.unit || 'unit';

    return `
        <div class="product-card" data-category="${product.category}" data-product-id="${product.id}">
            <a href="product-detail.html?id=${product.id}" class="product-image">
                <div class="product-image-inner">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                </div>
                <div class="product-overlay"></div>
                <div class="product-badges">${badges}</div>
            </a>
            <div class="product-info">
                <a href="product-detail.html?id=${product.id}">
                    <h3 class="product-name">${product.name}</h3>
                </a>
                <p class="product-desc">${product.description}</p>
                ${price ? `<p class="product-price">${price}<span class="product-unit">/${unit}</span></p>` : ''}
            </div>
            <div class="product-footer">
                <div class="product-cart-controls">
                    <div class="qty-selector" data-moq="1">
                        <button type="button" class="qty-btn-sm minus" disabled>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>
                        </button>
                        <span class="qty-value">1</span>
                        <button type="button" class="qty-btn-sm plus">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                        </button>
                    </div>
                    <button class="add-to-cart-btn" data-product-id="${product.id}" data-moq="1">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/>
                        </svg>
                        Add
                    </button>
                </div>
            </div>
        </div>
    `;
}

/* ============================================
   Testimonials Slider
   ============================================ */
function initTestimonials() {
    const cards = document.querySelectorAll('.testimonial-card');
    const dots = document.querySelectorAll('.testimonial-dot');

    if (!cards.length || !dots.length) return;

    let currentIndex = 0;

    function showTestimonial(index) {
        cards.forEach((card, i) => {
            card.classList.toggle('active', i === index);
        });
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
        currentIndex = index;
    }

    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => showTestimonial(i));
    });

    // Auto-rotate
    setInterval(() => {
        const nextIndex = (currentIndex + 1) % cards.length;
        showTestimonial(nextIndex);
    }, 5000);
}

/* ============================================
   Counter Animation
   ============================================ */
function initCounters() {
    const counters = document.querySelectorAll('[data-count]');

    counters.forEach(counter => {
        const target = parseInt(counter.dataset.count);
        const isInHero = counter.closest('.hero-stats-bar') || counter.closest('.hero-stats');

        if (isInHero) {
            // Hero stats - animate after short delay (when page loads)
            setTimeout(() => {
                animateCounter(counter, target);
            }, 1200);
        } else {
            // Other stats - animate on scroll
            ScrollTrigger.create({
                trigger: counter,
                start: 'top 80%',
                onEnter: () => animateCounter(counter, target),
                once: true
            });
        }
    });
}

function animateCounter(counter, target) {
    gsap.fromTo(counter,
        { innerHTML: 0 },
        {
            innerHTML: target,
            duration: 2.5,
            ease: 'power2.out',
            snap: { innerHTML: 1 },
            onUpdate: function() {
                counter.innerHTML = Math.round(gsap.getProperty(counter, 'innerHTML'));
            }
        }
    );
}

/* ============================================
   Contact Form
   ============================================ */
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;

        // Simulate submission
        btn.innerHTML = '<span>Sending...</span>';
        btn.disabled = true;

        setTimeout(() => {
            btn.innerHTML = '<span>Message Sent!</span>';

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
                form.reset();
            }, 2000);
        }, 1500);
    });
}

/* ============================================
   Product Carousel (Featured)
   ============================================ */
function initProductCarousel() {
    const carousel = document.querySelector('.product-carousel');
    if (!carousel) return;

    const track = carousel.querySelector('.carousel-track');
    const slides = carousel.querySelectorAll('.carousel-slide');
    const prevBtn = carousel.querySelector('.carousel-prev');
    const nextBtn = carousel.querySelector('.carousel-next');
    const dotsContainer = carousel.querySelector('.carousel-dots');

    if (!track || slides.length === 0) return;

    let currentIndex = 0;
    const totalSlides = slides.length;

    // Create dots
    if (dotsContainer) {
        slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.classList.add('carousel-dot');
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        });
    }

    function updateCarousel() {
        gsap.to(track, {
            x: `-${currentIndex * 100}%`,
            duration: 0.6,
            ease: 'power3.out'
        });

        // Update dots
        const dots = dotsContainer?.querySelectorAll('.carousel-dot');
        dots?.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });

        // Animate current slide content
        const currentSlide = slides[currentIndex];
        gsap.fromTo(currentSlide.querySelector('.carousel-content'),
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.6, delay: 0.2 }
        );
    }

    function goToSlide(index) {
        currentIndex = index;
        updateCarousel();
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % totalSlides;
        updateCarousel();
    }

    function prevSlide() {
        currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
        updateCarousel();
    }

    prevBtn?.addEventListener('click', prevSlide);
    nextBtn?.addEventListener('click', nextSlide);

    // Auto-play
    let autoPlay = setInterval(nextSlide, 5000);

    carousel.addEventListener('mouseenter', () => clearInterval(autoPlay));
    carousel.addEventListener('mouseleave', () => {
        autoPlay = setInterval(nextSlide, 5000);
    });

    // Touch support
    let touchStartX = 0;
    let touchEndX = 0;

    track.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    track.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchStartX - touchEndX > 50) nextSlide();
        if (touchEndX - touchStartX > 50) prevSlide();
    });
}

/* ============================================
   Category Showcase
   ============================================ */
function initCategoryShowcase() {
    const categories = document.querySelectorAll('.category-card');
    if (!categories.length) return;

    categories.forEach((card, index) => {
        // Entrance animation
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            },
            opacity: 0,
            y: 60,
            duration: 0.8,
            delay: index * 0.15,
            ease: 'power3.out'
        });

        // Hover parallax effect on image
        const image = card.querySelector('.category-image img');
        if (image) {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;

                gsap.to(image, {
                    x: x * 20,
                    y: y * 20,
                    scale: 1.1,
                    duration: 0.4
                });
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(image, {
                    x: 0,
                    y: 0,
                    scale: 1,
                    duration: 0.4
                });
            });
        }
    });
}

/* ============================================
   Parallax Gallery
   ============================================ */
function initParallaxGallery() {
    const gallery = document.querySelector('.parallax-gallery');
    if (!gallery) return;

    const items = gallery.querySelectorAll('.gallery-item');

    items.forEach((item, index) => {
        const image = item.querySelector('img');
        const speed = item.dataset.speed || 0.5;

        // Parallax scroll effect
        gsap.to(image, {
            scrollTrigger: {
                trigger: item,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1
            },
            y: `${speed * 100}px`,
            ease: 'none'
        });

        // Entrance animation
        gsap.from(item, {
            scrollTrigger: {
                trigger: item,
                start: 'top 90%',
                toggleActions: 'play none none reverse'
            },
            opacity: 0,
            scale: 0.9,
            duration: 0.8,
            delay: index * 0.1
        });
    });
}

/* ============================================
   Product Marquee
   ============================================ */
function initProductMarquee() {
    const marquee = document.querySelector('.product-marquee');
    if (!marquee) return;

    const track = marquee.querySelector('.marquee-track');
    if (!track) return;

    // Clone items for seamless loop
    const items = track.innerHTML;
    track.innerHTML = items + items;

    // Calculate width and animate
    const trackWidth = track.scrollWidth / 2;

    gsap.to(track, {
        x: -trackWidth,
        duration: 30,
        ease: 'none',
        repeat: -1
    });

    // Pause on hover
    marquee.addEventListener('mouseenter', () => {
        gsap.to(track, { timeScale: 0, duration: 0.3 });
    });

    marquee.addEventListener('mouseleave', () => {
        gsap.to(track, { timeScale: 1, duration: 0.3 });
    });
}

/* ============================================
   Smooth Scroll
   ============================================ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();

        const headerHeight = document.querySelector('.header')?.offsetHeight || 80;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;

        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    });
});
