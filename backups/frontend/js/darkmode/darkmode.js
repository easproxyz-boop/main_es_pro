$(function () {
  const THEME_KEY = 'app-theme';
  const $themeOptions = $('.theme-option');
  const toastOptions = { position: 'topRight', timeout: 2000 };

  // Apply theme to document
  function applyTheme(theme) {
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      $('html').attr('data-bs-theme', prefersDark ? 'dark' : 'light');
    } else {
      $('html').attr('data-bs-theme', theme);
    }
  }

  // Update UI of theme buttons
  function updateActiveThemeUI(theme) {
    $themeOptions.removeClass('active bg-primary text-white');
    $themeOptions.filter(`[data-theme="${theme}"]`).addClass('active bg-primary text-white');
  }

  // Initialize theme
  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'system';
    applyTheme(savedTheme);
    updateActiveThemeUI(savedTheme);

    // Click event for theme buttons
    $themeOptions.on('click', function () {
      const selectedTheme = $(this).data('theme');
      localStorage.setItem(THEME_KEY, selectedTheme);
      applyTheme(selectedTheme);
      updateActiveThemeUI(selectedTheme);

      if (typeof iziToast !== 'undefined') {
        iziToast.success({ ...toastOptions, title: 'Theme Changed', message: `Applied ${selectedTheme} mode` });
      }
    });

    // Watch for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    function handleSystemChange() {
      if (localStorage.getItem(THEME_KEY) === 'system') {
        applyTheme('system');
        updateActiveThemeUI('system');
      }
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
    } else if (mediaQuery.addListener) { // fallback
      mediaQuery.addListener(handleSystemChange);
    }
  }

  // Initialize on DOM ready
  initTheme();
});
