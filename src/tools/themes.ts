


export function setTheme(){
  const currentTheme = document.body.classList.contains('force-dark') ? 'dark' : 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';

  document.body.classList.remove(`force-${currentTheme}`);
  document.body.classList.add(`force-${newTheme}`);

  }