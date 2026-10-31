'use strict';
const stages=[
 {title:'Explorer un film',description:'Des univers cinématographiques à parcourir et une fiche film pour préparer sa sortie.',label:'DÉCOUVRIR',detail:'Explore un univers cinéma',icon:'✦',route:'home',theme:'discover'},
 {title:'Sélectionner une séance',description:'Dates, horaires et cinémas de démonstration. Le prototype propose aussi une carte spatiale interactive.',label:'PLANIFIER',detail:'Cinéma · date · horaire',icon:'◷',route:'seances',theme:'seances'},
 {title:'Choisir ses fauteuils',description:'Plan de salle interactif, places disponibles ou occupées et tarifs ajustables.',label:'S’INSTALLER',detail:'Carte des fauteuils',icon:'▦',route:'seats',theme:'seats'},
 {title:'Commander ses snacks',description:'Choix de pop-corn, boissons et menus, avec quantités et total en direct.',label:'COMMANDER',detail:'Click & collect (démo)',icon:'🍿',route:'snacks',theme:'snacks'},
 {title:'Retrouver ses billets',description:'Récapitulatif complet, référence de démonstration et informations de retrait des snacks.',label:'EMBARQUER',detail:'Billet de démonstration',icon:'▣',route:'ticket',theme:'ticket'}
];
const buttons=[...document.querySelectorAll('[data-step]')];
const visual=document.getElementById('journey-visual');
const jLink=document.getElementById('journey-link');
function selectStage(index){
 const item=stages[index];if(!item)return;
 buttons.forEach((button,i)=>{button.classList.toggle('selected',i===index);button.setAttribute('aria-pressed',String(i===index))});
 visual.className='journey-visual stage-'+item.theme;
 visual.innerHTML=`<span class="journey-icon" aria-hidden="true">${item.icon}</span><strong>${item.label}</strong><span>${item.detail}</span>`;
 document.getElementById('journey-stage-count').textContent=`ÉTAPE 0${index+1} / 05`;
 document.getElementById('journey-stage-title').textContent=item.title;
 document.getElementById('journey-stage-desc').textContent=item.description;
 jLink.href='../orbit/index.html#/'+item.route;
}
buttons.forEach(b=>b.addEventListener('click',()=>selectStage(Number(b.dataset.step))));
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
if(!reduced){
 const targets=document.querySelectorAll('.section,.phone-cell,.case-facts,.outro');
 if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('seen');observer.unobserve(entry.target)}}),{threshold:.08});targets.forEach(t=>observer.observe(t))}
 else targets.forEach(t=>t.classList.add('seen'));
}else document.querySelectorAll('.section,.phone-cell,.case-facts,.outro').forEach(t=>t.classList.add('seen'));
