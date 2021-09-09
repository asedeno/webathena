document.addEventListener('mousemove', event => {
  for (const eye of document.querySelectorAll('#logo img')) {
    const {left, top} = eye.getBoundingClientRect();
    const dx = event.clientX - left - eye.offsetWidth / 2;
    const dy = event.clientY - top - eye.offsetHeight / 2;
    eye.style.transform = `rotate(${Math.atan2(dx, -dy)}rad)`;
  }
});
