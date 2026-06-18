const pages = Array.from(document.querySelectorAll('.page'));
const pageLinks = Array.from(document.querySelectorAll('a[href^="#"]'));
const workSections = Array.from(document.querySelectorAll('.work-year-section'));
const selectedPage = document.querySelector('#selected-works');

const ENTERED_KEY = 'aanya:entered';
const hasEntered = () => {
    try { return sessionStorage.getItem(ENTERED_KEY) === '1'; }
    catch (_) { return false; }
};
const markEntered = () => {
    try { sessionStorage.setItem(ENTERED_KEY, '1'); } catch (_) { /* ignore */ }
};

const validPages = new Set(pages.map((page) => page.id));
const validWorkSections = new Set(workSections.map((section) => section.id));

function getHashId() {
    return window.location.hash.replace('#', '');
}

function getPageForHash(id) {
    if (!hasEntered()) return 'entrance';
    if (id === 'entrance') return 'home';
    if (validPages.has(id)) return id;
    if (validWorkSections.has(id)) return 'selected-works';
    return 'home';
}

function getWorkSectionForHash(id) {
    return validWorkSections.has(id) ? id : null;
}

function setCurrentLinks(pageId, sectionId = null) {
    pageLinks.forEach((link) => {
        const targetId = link.getAttribute('href')?.replace('#', '');
        const isCurrent = targetId === sectionId || (!sectionId && targetId === pageId);
        link.toggleAttribute('aria-current', isCurrent);
    });
}

function setActivePage(pageId, options = {}) {
    pages.forEach((page) => {
        const isActive = page.id === pageId;
        page.classList.toggle('is-active', isActive);
        page.toggleAttribute('hidden', !isActive);
        page.setAttribute('aria-hidden', String(!isActive));

        if (isActive) {
            if (!options.preserveScroll) page.scrollTop = 0;
            page.focus({ preventScroll: true });
        }
    });

    setCurrentLinks(pageId, options.sectionId || null);
}

function scrollToWorkSection(sectionId, behavior = 'smooth') {
    if (!selectedPage || !sectionId) return;

    const section = document.getElementById(sectionId);
    if (!section) return;

    selectedPage.scrollTo({
        top: Math.max(section.offsetTop - 24, 0),
        behavior,
    });
    setCurrentLinks('selected-works', sectionId);
}

function routeToHash(behavior = 'smooth') {
    if (!hasEntered()) {
        if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        setActivePage('entrance');
        return;
    }

    const hashId = getHashId();
    const pageId = getPageForHash(hashId);
    const sectionId = getWorkSectionForHash(hashId);

    if (hashId === 'entrance' || (hashId && !validPages.has(hashId) && !validWorkSections.has(hashId))) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search + '#home');
    }

    setActivePage(pageId, { sectionId });
    if (sectionId) window.requestAnimationFrame(() => scrollToWorkSection(sectionId, behavior));
}

pageLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
        const href = link.getAttribute('href');
        const targetId = href?.replace('#', '');

        if (!targetId || (!validPages.has(targetId) && !validWorkSections.has(targetId))) return;

        event.preventDefault();

        const isEnterClick = link.classList.contains('enter-piece');
        if (isEnterClick) {
            markEntered();
            window.history.replaceState(null, '', href);
        } else {
            window.history.pushState(null, '', href);
        }

        routeToHash();
    });
});

window.addEventListener('popstate', () => routeToHash('auto'));

pages.forEach((page) => {
    page.setAttribute('tabindex', '-1');
});

routeToHash('auto');

document.querySelectorAll('.work-image-container--multi').forEach((container) => {
    const images = Array.from(container.querySelectorAll('.work-multi-img'));
    if (images.length < 2) return;

    let activeIndex = Math.max(0, images.findIndex((img) => img.classList.contains('is-active')));
    if (activeIndex === -1) activeIndex = 0;

    const legacyNav = container.querySelector('.work-multi-dots, .work-multi-nav');
    if (legacyNav) legacyNav.remove();

    const makeArrow = (direction, label, glyph) => {
        const arrow = document.createElement('button');
        arrow.type = 'button';
        arrow.className = `work-multi-arrow work-multi-arrow--${direction}`;
        arrow.setAttribute('aria-label', label);
        arrow.textContent = glyph;
        return arrow;
    };

    const prev = makeArrow('prev', 'Previous image', '‹');
    const next = makeArrow('next', 'Next image', '›');
    container.append(prev, next);

    function select(index) {
        const count = images.length;
        const target = ((index % count) + count) % count;
        if (target === activeIndex) return;
        images[activeIndex].classList.remove('is-active');
        activeIndex = target;
        images[activeIndex].classList.add('is-active');
    }

    prev.addEventListener('click', () => select(activeIndex - 1));
    next.addEventListener('click', () => select(activeIndex + 1));
});

const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.getElementById('lightbox-close');

if (lightbox && lightboxImg && lightboxClose) {
    const openLightbox = (img) => {
        lightboxImg.src = img.currentSrc || img.src;
        lightboxImg.alt = img.alt || '';
        lightbox.classList.add('is-open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
        lightbox.classList.remove('is-open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        lightboxImg.src = '';
    };

    document.querySelectorAll('.work-image').forEach((img) => {
        img.addEventListener('click', (event) => {
            const imageSource = img.currentSrc || img.getAttribute('src') || '';
            if (!imageSource.trim()) return;
            if (img.classList.contains('work-multi-img') && !img.classList.contains('is-active')) return;
            event.preventDefault();
            openLightbox(img);
        });
    });

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (event) => {
        if (event.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox();
    });
}
