window.addEventListener('load', () => {
  document.querySelector('#whatis a').addEventListener('click', event => {
    const info = document.querySelector('#info');
    info.style.height = info.style.height ? '' : info.scrollHeight + 'px';
    event.preventDefault();
  });
});
