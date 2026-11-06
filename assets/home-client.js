(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  for (const carousel of document.querySelectorAll('[data-carousel]')) {
    const slides = [...carousel.querySelectorAll('[data-slide]')];
    if (!slides.length) continue;
    const controls = carousel.querySelector('[data-carousel-controls]');
    const pause = carousel.querySelector('[data-pause]');
    const dots = [...carousel.querySelectorAll('[data-go]')];
    const status = carousel.querySelector('[data-slide-status]');
    const automatic = carousel.dataset.autoplay === 'true';
    const seconds = Math.max(4, Number(carousel.dataset.interval) || 7);
    let index = 0;
    let paused = false;
    let hovering = false;
    let timer;
    let pointerStart;
    carousel.dataset.enhanced = 'true';
    if (controls) controls.hidden = slides.length < 2;
    if (pause) pause.hidden = !automatic;

    function schedule() {
      clearTimeout(timer);
      if (slides.length > 1 && automatic && !paused && !hovering &&
          !reducedMotion.matches && !document.hidden && !carousel.contains(document.activeElement)) {
        timer = setTimeout(() => show(index + 1, false), seconds * 1000);
      }
    }
    function updatePause() {
      if (!pause) return;
      pause.disabled = reducedMotion.matches;
      pause.textContent = reducedMotion.matches ? 'Movimiento reducido' : paused ? 'Reanudar' : 'Pausar';
      pause.setAttribute('aria-pressed', String(paused || reducedMotion.matches));
      pause.setAttribute('aria-label', reducedMotion.matches ? 'Cambio automático desactivado por movimiento reducido' :
        paused ? 'Reanudar cambio automático' : 'Pausar cambio automático');
    }
    function show(next, announce = true) {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, position) => {
        slide.hidden = position !== index;
        slide.inert = position !== index;
        slide.classList.toggle('is-current', position === index);
      });
      dots.forEach((dot, position) => dot.setAttribute('aria-pressed', String(position === index)));
      if (status && announce) status.textContent = 'Imagen ' + (index + 1) + ' de ' + slides.length;
      schedule();
    }
    carousel.querySelector('[data-prev]')?.addEventListener('click', () => show(index - 1));
    carousel.querySelector('[data-next]')?.addEventListener('click', () => show(index + 1));
    dots.forEach(dot => dot.addEventListener('click', () => show(Number(dot.dataset.go))));
    pause?.addEventListener('click', () => {
      paused = !paused;
      updatePause();
      schedule();
    });
    carousel.addEventListener('mouseenter', () => { hovering = true; schedule(); });
    carousel.addEventListener('mouseleave', () => { hovering = false; schedule(); });
    carousel.addEventListener('focusin', schedule);
    carousel.addEventListener('focusout', () => setTimeout(schedule, 0));
    carousel.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      show(index + (event.key === 'ArrowLeft' ? -1 : 1));
    });
    carousel.addEventListener('pointerdown', event => {
      pointerStart = event.target.closest('a,button') ? null : event.clientX;
    });
    carousel.addEventListener('pointerup', event => {
      if (pointerStart === null || pointerStart === undefined) return;
      const distance = event.clientX - pointerStart;
      if (Math.abs(distance) > 45) show(index + (distance < 0 ? 1 : -1));
      pointerStart = null;
    });
    document.addEventListener('visibilitychange', schedule);
    reducedMotion.addEventListener('change', () => { updatePause(); schedule(); });
    updatePause();
    show(0, false);
  }

  if (!reducedMotion.matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.remove('reveal-pending');
        observer.unobserve(entry.target);
      }
    }, {threshold: 0.08});
    for (const element of document.querySelectorAll('[data-reveal]')) {
      if (element.getBoundingClientRect().top < window.innerHeight * 0.9) continue;
      element.classList.add('reveal-pending');
      observer.observe(element);
    }
    reducedMotion.addEventListener('change', () => {
      if (!reducedMotion.matches) return;
      document.querySelectorAll('.reveal-pending').forEach(element => element.classList.remove('reveal-pending'));
      observer.disconnect();
    });
  }

  const menus = [...document.querySelectorAll('.institution-nav details')];
  for (const menu of menus) {
    menu.addEventListener('toggle', () => {
      if (menu.open) menus.forEach(other => { if (other !== menu) other.open = false; });
    });
  }
  document.addEventListener('click', event => {
    if (!event.target.closest('.institution-nav')) menus.forEach(menu => { menu.open = false; });
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const menu = menus.find(item => item.open);
    if (menu) { menu.open = false; menu.querySelector('summary')?.focus(); }
  });

  for (const editor of document.querySelectorAll('.slide-editor')) {
    const imageUrl = editor.querySelector('[data-image-url]');
    const preview = editor.querySelector('[data-image-preview]');
    imageUrl?.addEventListener('change', () => {
      const value = imageUrl.value.trim();
      if (/^https:\/\//.test(value) || /^\/(?!\/)/.test(value)) preview.src = value;
    });
    const upload = editor.querySelector('[data-upload]');
    upload?.addEventListener('click', async () => {
      const file = editor.querySelector('[data-image-file]')?.files[0];
      const message = editor.querySelector('[data-upload-status]');
      if (!file) { message.textContent = 'Selecciona una imagen de tu equipo.'; return; }
      if (file.size > 5 * 1024 * 1024) { message.textContent = 'La imagen debe pesar como máximo 5 MB.'; return; }
      upload.disabled = true;
      message.textContent = 'Subiendo imagen…';
      try {
        const response = await fetch('/admin/carrusel/imagen', {
          method: 'POST', headers: {'Content-Type': file.type, 'X-File-Name': encodeURIComponent(file.name)}, body: file
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'No se pudo subir. Comprueba tu sesión.');
        imageUrl.value = result.url;
        preview.src = result.url;
        message.textContent = 'Imagen cargada. Guarda el borrador para conservarla en el carrusel.';
      } catch (error) {
        message.textContent = error.message;
      } finally {
        upload.disabled = false;
      }
    });
  }
})();
