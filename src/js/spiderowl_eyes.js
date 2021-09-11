window.addEventListener('load', () => {
  const locMap = {
    'eye1': { left: '78px', top: '12px' },
    'eye2': { left: '87px', top: '16px' },
    'eye3': { left: '105px', top: '16px' },
    'eye4': { left: '121px', top: '12px' },
  };
  for (const eye of document.querySelectorAll('#logo img')) {
    eye.style.left = locMap[eye.id].left;
    eye.style.top = locMap[eye.id].top;
    eye.removeAttribute('hidden');
  }
});

document.addEventListener('mousemove', event => {
  for (const eye of document.querySelectorAll('#logo img')) {
    const {left, top} = eye.getBoundingClientRect();
    const dx = event.clientX - left - eye.offsetWidth / 2;
    const dy = event.clientY - top - eye.offsetHeight / 2;
    eye.style.transform = `rotate(${Math.atan2(dx, -dy)}rad)`;
  }
});
