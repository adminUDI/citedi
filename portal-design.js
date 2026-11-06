const networks=[
 ['Facebook','https://www.facebook.com/CITEDIIPN/','facebook','<path d="M14 21v-8h3l.5-4H14V7c0-1 .3-2 2-2h2V1h-3c-4 0-6 2-6 6v2H6v4h3v8z"/>'],
 ['Instagram','https://www.instagram.com/citedi_ipn/','instagram','<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="6" r="1.3"/>'],
 ['YouTube','https://www.youtube.com/@citediipn','youtube','<rect x="1" y="4" width="22" height="16" rx="5"/><path d="m10 8 6 4-6 4z" fill="#fff"/>'],
 ['LinkedIn','https://www.linkedin.com/company/citedi-ipn/','linkedin','<path d="M3 8h4v13H3zm0-6h4v4H3zm7 6h4v2c1-3 8-4 8 3v8h-4v-7c0-4-4-3-4 0v7h-4z"/>']
];
export function socialIcons(){return '<div class="social-icons">'+networks.map(([name,url,cls,path])=>'<a class="social-icon '+cls+'" href="'+url+'" aria-label="'+name+'" title="'+name+'"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+path+'</svg></a>').join('')+'</div>';}
export function contactSection(content,html,form){
 return '<section id="contacto" class="contact-hub"><div class="contact-hub-grid"><section class="contact-social"><h2>Redes sociales</h2>'+socialIcons()+'<p>Conecta con nuestra comunidad y conoce las actividades del CITEDI.</p><a href="/directorio">Directorio institucional ↗</a></section><section class="contact-map"><h2>Ubicación</h2><iframe title="Ubicación del CITEDI en Tijuana" src="https://www.google.com/maps?q=CITEDI+IPN+Tijuana&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe><p>'+html(content.contact)+'</p><a href="https://www.google.com/maps/dir/?api=1&amp;destination=CITEDI+IPN+Tijuana">Cómo llegar al CITEDI ↗</a></section><section class="contact-hub-form" aria-label="Formulario de contacto">'+form('contact',html).replace('<h2>Escríbenos</h2>','<h2>Formulario de contacto</h2>')+'</section></div></section>';
}
