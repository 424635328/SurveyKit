document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIcon = document.getElementById('menu-icon');

    if (menuToggle && mobileMenu && menuIcon) {
        menuToggle.addEventListener('click', () => {
            const expanded = menuToggle.getAttribute('aria-expanded') === 'true' || false;
            menuToggle.setAttribute('aria-expanded', !expanded);
            mobileMenu.classList.toggle('hidden', expanded);
            menuIcon.classList.toggle('fa-bars', expanded);
            menuIcon.classList.toggle('fa-times', !expanded);
        });
    }

    const searchToggleButton = document.getElementById('search-toggle-button');
    const searchToggleMobile = document.getElementById('search-toggle-mobile');

    const openSearch = () => {
        window.location.href = '../search.html';
    };

    if (searchToggleButton) {
        searchToggleButton.addEventListener('click', openSearch);
    }
    if (searchToggleMobile) {
        searchToggleMobile.addEventListener('click', (e) => {
            e.preventDefault();
            openSearch();
        });
    }

    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            openSearch();
        }
    });

    const footerYearElement = document.getElementById('footer-year');
    if (footerYearElement) {
        footerYearElement.textContent = new Date().getFullYear();
    }
});