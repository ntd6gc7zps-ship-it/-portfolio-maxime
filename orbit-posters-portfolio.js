/* Mockups Orbit intégrés au portfolio : films officiels, visuels dynamiques et tailles adaptatives. */
(function(){
"use strict";
var root=location.pathname.includes("/projets/")?"../":"";
var link=document.createElement("link");link.rel="stylesheet";link.href=root+"orbit-posters-portfolio.css";document.head.appendChild(link);
var films=[
["Dune : Deuxième partie","SCIENCE-FICTION · 2024","https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg"],
["The Batman","ACTION · 2022","https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg"],
["Toy Story 5","FAMILLE · 2026","https://i.ebayimg.com/images/g/BOcAAeSwg6Bp7Aew/s-l1600.jpg"],
["Orange mécanique","DRAME · 1971","https://filmartgallery.com/cdn/shop/files/A-Clockwork-Orange-Vintage-Movie-Poster-Original_699cd5f7_5000x.jpg?v=1771929732"]
];
function screen(type){
 var el=document.createElement("div");
 el.className="orbit-ref-screen "+(type||"phone");
 el.setAttribute("role","img");
 el.setAttribute("aria-label","Interface Orbit présentant les affiches de Dune 2, The Batman, Toy Story 5 et Orange mécanique");
 var html='<div class="ors-header"><strong>◉ ORBIT</strong><small>Explorer · Séances · Avis · Snacks</small></div><div class="ors-search">⌕ Rechercher un film ou un univers...</div><div class="ors-filters"><span>Tous</span><span>Science-fiction</span><span>Action</span><span>Famille</span></div><div class="ors-label">À l’affiche</div><div class="ors-films">';
 films.forEach(function(f){html+='<div class="ors-film"><img src="'+f[2]+'" alt="Affiche de '+f[0]+'" loading="lazy"><b>'+f[0]+'</b><small>'+f[1]+'</small></div>';});
 el.innerHTML=html+"</div>";return el;
}
function replace(sel,type){
 document.querySelectorAll(sel).forEach(function(img){
  var div=screen(type);
  if(img.classList.contains("orbit-mockup"))div.classList.add("orbit-mockup","orbit-mockup-front");
  img.replaceWith(div);
 });
}
function refreshDialog(){
 var dlg=document.getElementById("project-dialog"),gallery=document.getElementById("dialog-gallery");
 if(!dlg||!gallery||!dlg.open||document.getElementById("dialog-title").textContent.trim()!=="Orbit.")return;
 if(gallery.classList.contains("orbit-ref-dialog"))return;
 gallery.classList.add("orbit-ref-dialog");
 var desktop=document.createElement("div"),phone=document.createElement("div"),snacks=document.createElement("img");
 desktop.className="ors-modal-desktop";desktop.appendChild(screen("desktop"));
 phone.className="ors-modal-phone";phone.appendChild(screen("phone"));
 snacks.className="ors-modal-snacks";snacks.src="assets/orbit-snacks-card.webp";snacks.alt="Interface Orbit snacks, pop-corn et boissons";snacks.loading="lazy";
 gallery.replaceChildren(desktop,phone,snacks);
}
function init(){
 replace(".orbit-mockup-front","phone");
 replace(".hero-phone-frame > img","phone");
 replace(".scene-browser > img","desktop");
 replace(".scene-phone > img","phone");
 replace(".showcase-overview > img","desktop");
 replace(".phone-cell .device > img[src*='orbit-mobile-explore']","phone");
 var dlg=document.getElementById("project-dialog");
 if(dlg){
  new MutationObserver(function(){if(!dlg.open){document.getElementById("dialog-gallery").classList.remove("orbit-ref-dialog");return;}queueMicrotask(refreshDialog);}).observe(dlg,{attributes:true,attributeFilter:["open"]});
  document.addEventListener("click",function(e){if(e.target.closest('[data-project="orbit"]'))setTimeout(refreshDialog,0);});
 }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();