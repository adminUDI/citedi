(() => {
  const en = document.documentElement.lang === 'en';
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
      pause.textContent = reducedMotion.matches ? (en?'Reduced motion':'Movimiento reducido') : paused ? (en?'Resume':'Reanudar') : (en?'Pause':'Pausar');
      pause.setAttribute('aria-pressed', String(paused || reducedMotion.matches));
      pause.setAttribute('aria-label', reducedMotion.matches ? 'Cambio automático desactivado por movimiento reducido' :
        paused ? (en?'Resume automatic slideshow':'Reanudar cambio automático') : (en?'Pause automatic slideshow':'Pausar cambio automático'));
    }
    function show(next, announce = true) {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, position) => {
        slide.hidden = position !== index;
        slide.inert = position !== index;
        slide.classList.toggle('is-current', position === index);
      });
      dots.forEach((dot, position) => dot.setAttribute('aria-pressed', String(position === index)));
      if (status && announce) status.textContent = (en?'Image ':'Imagen ') + (index + 1) + (en?' of ':' de ') + slides.length;
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

// Accessible Agenda Politécnica tabs, with keyboard navigation.
for (const list of document.querySelectorAll('.agenda-tabs')) {
 const tabs=[...list.querySelectorAll('[role="tab"]')];
 const activate=tab=>{for(const item of tabs){const active=item===tab;item.setAttribute('aria-selected',String(active));item.tabIndex=active?0:-1;document.getElementById(item.getAttribute('aria-controls')).hidden=!active;}};
 for(const tab of tabs){tab.addEventListener('click',()=>activate(tab));tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(tabs.indexOf(tab)+1)%tabs.length;if(event.key==='ArrowLeft')next=(tabs.indexOf(tab)+tabs.length-1)%tabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;if(next!==undefined){event.preventDefault();activate(tabs[next]);tabs[next].focus();}});}
}

for(const toggle of document.querySelectorAll('[data-contrast]'))toggle.addEventListener('click',()=>{const enabled=document.documentElement.classList.toggle('high-contrast');toggle.setAttribute('aria-pressed',String(enabled));});
let portalFontScale=100;
for(const control of document.querySelectorAll('[data-text-size]'))control.addEventListener('click',()=>{portalFontScale=control.dataset.textSize==='reset'?100:Math.max(80,Math.min(140,portalFontScale+(control.dataset.textSize==='increase'?10:-10)));document.documentElement.style.fontSize=portalFontScale+'%';});

for(const gallery of document.querySelectorAll('[data-infographics]')){
 const track=gallery.querySelector('.infographic-track'),cards=[...track.querySelectorAll('.infographic-card')],previous=gallery.querySelector('[data-info-prev]'),next=gallery.querySelector('[data-info-next]'),count=gallery.querySelector('[data-info-count]'),status=gallery.querySelector('[data-info-status]');
 const position=()=>{const width=cards[0]?.getBoundingClientRect().width||track.clientWidth;const gap=parseFloat(getComputedStyle(track).gap)||0;const first=Math.round(track.scrollLeft/(width+gap));const visible=Math.max(1,Math.round((track.clientWidth+gap)/(width+gap)));return {first,visible,width,gap};};
 const update=()=>{const {first,visible}=position();previous.disabled=track.scrollLeft<2;next.disabled=track.scrollLeft+track.clientWidth>=track.scrollWidth-2;count.textContent=(first+1)+'–'+Math.min(cards.length,first+visible)+' de '+cards.length;};
 const move=direction=>{const {visible,width,gap}=position();track.scrollBy({left:direction*visible*(width+gap),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});};
 previous.hidden=next.hidden=cards.length<2;previous.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));track.addEventListener('keydown',event=>{if(event.target!==track||!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();move(event.key==='ArrowLeft'?-1:1);});let announcement;track.addEventListener('scroll',()=>{update();clearTimeout(announcement);announcement=setTimeout(()=>{status.textContent='Infografías '+count.textContent;},220);},{passive:true});new ResizeObserver(update).observe(track);update();
}


for(const section of document.querySelectorAll('.social-strip')){
 const dialog=section.querySelector('dialog'),slot=dialog.querySelector('.social-dialog-player'),title=dialog.querySelector('h3'),watch=dialog.querySelector('[data-social-watch]');let trigger;
 for(const card of section.querySelectorAll('[data-social-video]'))card.addEventListener('click',event=>{
  if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||!dialog.showModal)return;
  const id=card.dataset.socialVideo;if(!/^[A-Za-z0-9_-]{11}$/.test(id))return;event.preventDefault();trigger=card;
  title.textContent=card.dataset.title;watch.href=card.href;const frame=document.createElement('iframe');frame.src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1';frame.title=card.dataset.title;frame.allow='autoplay; encrypted-media; picture-in-picture; web-share';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';slot.replaceChildren(frame);dialog.showModal();
 });
 dialog.querySelector('[data-social-close]').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{slot.replaceChildren();trigger?.focus();});
}

for(const opener of document.querySelectorAll('[data-contact-open]')){const dialog=document.getElementById('contact-dialog');if(!dialog?.showModal)continue;opener.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();dialog.showModal();});dialog.querySelector('[data-contact-close]').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>opener.focus());}
