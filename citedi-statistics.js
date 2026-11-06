export const statisticsUrl="/media/5ac8e1cdfc03c8c0349af70446aea5f3925c80e33d8b2f4e3b27cd35326dee0f.pdf";
const icons={
 students:'<circle cx="12" cy="8" r="4"/><circle cx="4" cy="9" r="3"/><circle cx="20" cy="9" r="3"/><path d="M5 23v-3a7 7 0 0 1 14 0v3zM0 18a5 5 0 0 1 4-5l2 1a10 10 0 0 0-3 5H0zm24 0v1h-3a10 10 0 0 0-3-5l2-1a5 5 0 0 1 4 5z"/>',
 graduates:'<path d="m1 7 11-5 11 5-11 5zM5 11l7 3 7-3v6c-4 4-10 4-14 0zM22 9h1v10h-1z"/>',
 laboratories:'<path d="M7 1h8v3h-1v5l6 10c1 2 0 4-3 4H5c-3 0-4-2-3-4L8 9V4H7zm3 3v6L6 17h10l-4-7V4z"/>',
 programs:'<path d="M1 3c4-2 7-1 10 1v18c-3-2-6-3-10-1zm12 1c3-2 6-3 10-1v18c-4-2-7-1-10 1z"/>',
 chart:'<path d="M2 2h2v18h19v2H2zM7 11h3v6H7zm5-5h3v11h-3zm5 3h3v8h-3z"/>'
};
const icon=(name)=>'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+icons[name]+'</svg>';
export function citediStatistics(){return '<section class="citedi-statistics" id="citedi-en-cifras" aria-labelledby="citedi-statistics-title"><div class="wrap"><div class="statistics-heading"><div><h2 id="citedi-statistics-title">CITEDI IPN</h2></div><div class="statistics-link"><a class="button primary" href="'+statisticsUrl+'">'+icon('chart')+'<span>Consultar resultados ECCO 2025</span><span aria-hidden="true">↗</span></a><small>Encuesta de Clima y Cultura Organizacional · PDF</small></div></div><div class="statistics-cards">'+[['35 +','Estudiantes','students','/conocenos#numeralia'],['308 +','Egresados','graduates','/conocenos#numeralia'],['8','Laboratorios','laboratories','/investigacion'],['2','Programas','programs','#oferta']].map(([number,label,type,url],i)=>'<a class="statistics-card'+''+'" href="'+url+'"><span class="statistics-icon">'+icon(type)+'</span><span class="statistics-value"><strong>'+number+'</strong><span>'+label+'</span></span></a>').join('')+'</div><a class="statistics-source" href="/conocenos#numeralia">Ver numeralia del centro <span aria-hidden="true">↗</span></a></div></section>';}
