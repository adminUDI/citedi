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
          !reducedMotion.matches && !document.hidden && !carousel.closest('[hidden]') && !carousel.contains(document.activeElement)) {
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
    carousel.addEventListener('portal:activate',()=>show(0,false));
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

for(const opener of document.querySelectorAll('[data-contact-open]')){const dialog=document.getElementById('contact-dialog');if(!dialog?.showModal)continue;opener.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();dialog.showModal();opener.classList.add('is-open');opener.setAttribute('aria-expanded','true');});dialog.querySelector('[data-contact-close]').addEventListener('click',()=>dialog.close());opener.setAttribute('aria-haspopup','dialog');opener.setAttribute('aria-controls','contact-dialog');opener.setAttribute('aria-expanded','false');dialog.addEventListener('close',()=>{opener.classList.remove('is-open');opener.setAttribute('aria-expanded','false');opener.focus();});}

// Use YouTube's official player state events to switch from video to notices.
let institutionalApi;
function youtubeReady(){if(window.YT?.Player)return Promise.resolve(window.YT);if(institutionalApi)return institutionalApi;institutionalApi=new Promise((resolve,reject)=>{window.onYouTubeIframeAPIReady=()=>resolve(window.YT);const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.onerror=()=>reject(new Error('Video unavailable'));document.head.append(script);});return institutionalApi;}
for(const stage of document.querySelectorAll('[data-unified-feature]')){
 const hero=stage.querySelector('[data-institutional-hero]'),video=stage.querySelector('[data-unified-video]'),banners=stage.querySelector('[data-unified-banners]'),bg=hero.querySelector('.institutional-video-background'),toggle=hero.querySelector('[data-institutional-toggle]'),watch=hero.querySelector('[data-institutional-watch]'),dialog=hero.querySelector('dialog'),slot=dialog.querySelector('.social-dialog-player'),videoButton=stage.querySelector('[data-show-video]'),bannerButton=stage.querySelector('[data-show-banners]'),status=stage.querySelector('[data-feature-status]');const en=document.documentElement.lang==='en';let player,modalPlayer,loading=false;
 const mode=showVideo=>{video.hidden=!showVideo;banners.hidden=showVideo;videoButton.setAttribute('aria-pressed',String(showVideo));bannerButton.setAttribute('aria-pressed',String(!showVideo));if(!showVideo){player?.pauseVideo();banners.querySelector('[data-carousel]')?.dispatchEvent(new Event('portal:activate'));}status.textContent=showVideo?(en?'Institutional video':'Video institucional'):(en?'Featured notices':'Avisos destacados');};
 const ended=()=>{stage.dataset.videoCompleted='true';if(dialog.open)dialog.close();mode(false);};
 async function playBackground(){if(loading)return;mode(true);if(player){if(player.getPlayerState()===0)player.seekTo(0,true);player.playVideo();return;}loading=true;try{const YT=await youtubeReady();const mount=document.createElement('div');bg.append(mount);player=new YT.Player(mount,{host:'https://www.youtube-nocookie.com',width:'1920',height:'1080',videoId:'MkoRxT--yC4',playerVars:{autoplay:1,mute:1,controls:0,playsinline:1,rel:0,origin:location.origin},events:{onReady:e=>{e.target.mute();if(video.hidden)e.target.pauseVideo();else e.target.playVideo();},onStateChange:e=>{if(e.data===YT.PlayerState.ENDED)ended();toggle.textContent=e.data===YT.PlayerState.PLAYING?(en?'Pause background video':'Pausar video de fondo'):(en?'Play background video':'Reproducir video de fondo');toggle.setAttribute('aria-pressed',String(e.data!==YT.PlayerState.PLAYING));},onError:event=>{console.warn('Institutional video error',event.data);toggle.hidden=true;mode(false);}}});}catch(error){console.warn("Institutional player:",error.message);toggle.hidden=true;mode(false);institutionalApi=undefined;}finally{loading=false;}}
 toggle.hidden=false;toggle.addEventListener('click',()=>{if(player?.getPlayerState()===1)player.pauseVideo();else playBackground();});bannerButton.addEventListener('click',()=>mode(false));videoButton.addEventListener('click',()=>playBackground());
 watch.addEventListener('click',async event=>{if(!dialog.showModal||event.ctrlKey||event.metaKey||event.shiftKey)return;event.preventDefault();player?.pauseVideo();dialog.showModal();try{const YT=await youtubeReady();if(!dialog.open)return;const mount=document.createElement('div');slot.replaceChildren(mount);modalPlayer=new YT.Player(mount,{host:'https://www.youtube-nocookie.com',width:'1920',height:'1080',videoId:'MkoRxT--yC4',playerVars:{autoplay:1,controls:1,playsinline:1,rel:0,origin:location.origin},events:{onStateChange:e=>{if(e.data===YT.PlayerState.ENDED)ended();}}});}catch{dialog.close();mode(false);}});dialog.querySelector('[data-hero-close]').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{modalPlayer?.destroy();modalPlayer=undefined;slot.replaceChildren();if(!video.hidden)watch.focus();});
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&!navigator.connection?.saveData&&matchMedia('(min-width: 761px)').matches)playBackground();else toggle.textContent=en?'Play background video':'Reproducir video de fondo';
}

for(const banner of document.querySelectorAll('[data-news-banner]')){const track=banner.querySelector('.news-banner-track'),previous=banner.querySelector('[data-news-prev]'),next=banner.querySelector('[data-news-next]'),status=banner.querySelector('[data-news-status]');const cards=[...track.children];if(cards.length<2)continue;previous.hidden=next.hidden=false;const move=direction=>{if(direction>0)track.append(track.firstElementChild);else track.prepend(track.lastElementChild);if(!matchMedia('(prefers-reduced-motion: reduce)').matches)track.animate([{opacity:.45,transform:'translateX('+(direction>0?'14':'-14')+'px)'},{opacity:1,transform:'translateX(0)'}],{duration:260,easing:'ease-out'});status.textContent=(document.documentElement.lang==='en'?'Featured news: ':'Noticia destacada: ')+track.firstElementChild.querySelector('h3').textContent;};previous.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));}
