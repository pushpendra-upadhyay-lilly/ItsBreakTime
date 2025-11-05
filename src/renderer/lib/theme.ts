export function applyTheme(theme: 'light' | 'dark' | 'system') {
  const root = document.documentElement;
  // console.log(`Applying theme: ${theme}`);

  if (theme === 'system') {
    // Remove data-theme to let CSS prefers-color-scheme take over
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }
}

export function getResolvedTheme(): 'light' | 'dark' {
  const theme = document.documentElement.getAttribute('data-theme');

  if (theme === 'light' || theme === 'dark') {
    return theme;
  }

  // System preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
