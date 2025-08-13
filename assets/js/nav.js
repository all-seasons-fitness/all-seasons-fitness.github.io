document.addEventListener('DOMContentLoaded', function() {
    const currentUrl = window.location.href;
    const navLinks = document.querySelectorAll('nav.navbar li a');

    // skip this on the home page - not needed and prevents matching the about link (#)
    if (!currentUrl.includes('#page-top')) {
        navLinks.forEach(link => {
            // Check if the link's href matches or is included in the current URL
            if (currentUrl.includes(link.href)) {
                link.classList.add('active');
                if (link.classList.contains('nav-sub-menu-link')) {
                    const topLevelListItem = link.closest('li.page-scroll');
                    const topLevelLink = topLevelListItem.querySelector('a.nav-sub-menu-top-level');
                    topLevelLink.classList.add('active');
                }
            }
        });
    }
});
