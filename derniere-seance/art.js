'use strict';
function sprite(width, height, paint) {
  const image = document.createElement('canvas');
  image.width = width;
  image.height = height;
  paint(image.getContext('2d'));
  return image;
}
function ellipse(c, x, y, rx, ry, color) {
  c.fillStyle = color;
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill();
}
function path(c, points, color) {
  c.fillStyle = color;
  c.beginPath();
  points.forEach(([x,y], i) => i ? c.lineTo(x,y) : c.moveTo(x,y));
  c.closePath(); c.fill();
}
// A fixed seed keeps the damaged surfaces consistent between frames.
let artSeed = 913;
function randomArt() {
  artSeed = (artSeed * 1664525 + 1013904223) >>> 0;
  return artSeed / 4294967296;
}
function face(c, kind) {
  c.fillStyle = '#030305'; c.fillRect(0,0,256,320);
  const halo = c.createRadialGradient(128,145,6,128,145,145);
  halo.addColorStop(0,'#34393a'); halo.addColorStop(1,'#030305');
  c.fillStyle = halo; c.fillRect(0,0,256,320);
  path(c, [[32,320],[47,78],[80,22],[171,14],[212,70],[242,320]], '#09090c');
  const skin = c.createRadialGradient(113,120,8,145,158,110);
  skin.addColorStop(0, kind === 'nun' ? '#beb9a1' : '#a5ada1');
  skin.addColorStop(.56,'#6e776d'); skin.addColorStop(1,'#151c1c');
  ellipse(c,128,157,66,112,skin);
  if (kind === 'nun') {
    path(c, [[60,83],[70,31],[179,31],[197,81],[178,64],[81,64]], '#b2b09d');
    path(c, [[38,320],[48,90],[72,72],[65,235],[97,287],[167,279],[191,231],[186,72],[212,88],[235,320]], '#08080c');
    c.strokeStyle='#494947';c.lineWidth=7;c.beginPath();c.moveTo(77,255);c.quadraticCurveTo(126,300,182,251);c.stroke();
  } else {
    for (let i=0;i<85;i++) {
      const x=49+randomArt()*155;
      c.strokeStyle=i%3?'#090a0b':'#20211e';c.lineWidth=1+randomArt()*5;
      c.beginPath();c.moveTo(124+(x-124)*.5,22);c.bezierCurveTo(x,75,x-30,150,x+(x<128?-25:25),304);c.stroke();
    }
  }
  ellipse(c,97,132,24,16,'#111414');ellipse(c,160,130,25,17,'#0c1110');
  ellipse(c,99,132,8,5,'#d7ddbd');ellipse(c,158,130,8,5,'#d7ddbd');
  ellipse(c,100,132,2,5,'#050707');ellipse(c,157,130,2,5,'#050707');
  path(c,[[125,136],[113,179],[133,186],[145,174]],'#4c554b');
  ellipse(c,128,222,32,41,'#1b1b16');ellipse(c,128,227,25,34,'#010304');
  for(let i=0;i<8;i++) {
    const x=106+i*6;
    path(c,[[x,193],[x+5,196],[x+3,207+randomArt()*6]],'#aaac94');
    path(c,[[x,253],[x+5,251],[x+2,242-randomArt()*5]],'#7f8978');
  }
  c.lineWidth=1;
  for(let i=0;i<50;i++) {
    const x=78+randomArt()*101,y=85+randomArt()*190;
    c.strokeStyle='rgba(29,36,29,.32)';c.beginPath();c.moveTo(x,y);c.lineTo(x+randomArt()*12-6,y+5);c.lineTo(x+randomArt()*13-6,y+15);c.stroke();
  }
  for(let i=0;i<900;i++) {
    const x=70+randomArt()*116,y=70+randomArt()*205;
    c.fillStyle=randomArt()<.5?'#c0c4a70d':'#020d0c1c';c.fillRect(x,y,1+randomArt()*3,1);
  }
}
const faces = {
  nun: sprite(256,320,c=>face(c,'nun')),
  crawler: sprite(256,320,c=>face(c,'crawler'))
};
const art = {
  nun: sprite(170,320,c=>{
    path(c,[[65,34],[111,34],[135,145],[166,314],[9,314],[44,142]],'#12151b');
    path(c,[[63,81],[40,171],[7,246],[18,251],[68,180]],'#363832');
    path(c,[[107,78],[140,174],[168,244],[155,256],[97,177]],'#363832');
    for(let i=0;i<6;i++)path(c,[[68+i*7,108],[24+i*21,311],[33+i*21,311]],i%2?'#24262b':'#191c22');
    c.drawImage(faces.nun,59,22,143,263,52,5,67,120);
    c.strokeStyle='#6d6d5f';c.lineWidth=2;c.beginPath();c.moveTo(86,140);c.lineTo(86,174);c.moveTo(78,151);c.lineTo(94,151);c.stroke();
  }),
  crawler: sprite(280,180,c=>{
    path(c,[[83,80],[151,64],[193,104],[238,122],[274,168],[253,175],[207,143],[159,128],[90,145],[57,126],[22,174],[4,168],[33,107]],'#646a5c');
    path(c,[[96,91],[152,73],[192,108],[174,146],[93,142]],'#c0b99b');
    for(let i=0;i<7;i++) {c.strokeStyle='#575e51';c.beginPath();c.moveTo(102,99+i*6);c.lineTo(162,86+i*6);c.stroke();}
    c.drawImage(faces.crawler,60,35,142,265,65,3,82,116);
  }),
  fuse: sprite(64,100,c=>{
    c.shadowColor='#c8c79b';c.shadowBlur=10;c.fillStyle='#a5b59a';c.fillRect(21,16,22,67);c.shadowBlur=0;
    c.fillStyle='#d3d4b1';c.fillRect(17,10,30,14);c.fillRect(17,77,30,14);
    c.fillStyle='#47534b';c.fillRect(26,30,12,40);c.fillStyle='#b7a56c';c.fillRect(30,30,4,40);
  }),
  key: sprite(66,40,c=>{
    c.strokeStyle='#cab27b';c.lineWidth=5;c.beginPath();c.arc(18,19,9,0,7);c.moveTo(27,19);c.lineTo(57,19);c.lineTo(57,29);c.moveTo(47,20);c.lineTo(47,27);c.stroke();
  }),
  seat: sprite(120,146,c=>{
    ellipse(c,60,140,58,5,'#050507');
    c.fillStyle='#27141a';c.fillRect(18,110,10,31);c.fillRect(92,110,10,31);
    const red=c.createLinearGradient(10,0,100,100);red.addColorStop(0,'#78333c');red.addColorStop(.5,'#49232d');red.addColorStop(1,'#25141c');
    c.fillStyle=red;c.beginPath();c.roundRect(20,8,80,95,15);c.fill();c.fillRect(16,88,88,29);
    c.strokeStyle='#9e535144';c.lineWidth=3;c.strokeRect(29,18,62,72);
    c.fillStyle='#292329';c.fillRect(5,76,15,37);c.fillRect(100,76,15,37);
    c.fillStyle='#1e131d';c.fillRect(43,44,2,18);c.fillRect(46,49,16,2);
  }),
  screen: sprite(240,152,c=>{
    c.fillStyle='#241a20';c.fillRect(0,0,240,152);c.fillStyle='#818781';c.fillRect(18,8,204,121);
    for(let i=0;i<270;i++){c.fillStyle='#26343219';c.fillRect(18+randomArt()*201,8+randomArt()*118,2,2);}
    c.fillStyle='#293435';c.font='12px monospace';c.textAlign='center';c.fillText('FIN DE LA SÉANCE',120,69);
    c.fillStyle='#441c26';c.fillRect(0,0,15,150);c.fillRect(225,0,15,150);
  }),
  popcorn: sprite(140,220,c=>{
    c.fillStyle='#42222a';c.fillRect(13,125,114,95);c.fillRect(5,9,130,24);
    c.fillStyle='#75817b66';c.fillRect(13,35,114,90);c.strokeStyle='#918b77';c.lineWidth=4;c.strokeRect(13,33,114,94);
    for(let i=0;i<150;i++)ellipse(c,21+randomArt()*99,90+randomArt()*30,3,2,'#b9ab7a');
    c.fillStyle='#ccb38e';c.font='bold 14px serif';c.textAlign='center';c.fillText('POP CORN',70,27);
    c.fillStyle='#ccb38e';c.fillRect(47,162,46,2);c.fillRect(47,177,46,2);
  }),
  counter: sprite(220,140,c=>{
    c.fillStyle='#2c2224';c.fillRect(4,59,212,81);c.fillStyle='#8f806d';c.fillRect(0,51,220,13);
    c.fillStyle='#574033';c.fillRect(15,73,190,55);c.fillStyle='#212322';c.fillRect(136,22,49,29);c.fillStyle='#89917b';c.fillRect(142,27,35,12);
    c.fillStyle='#c5b590';c.font='14px serif';c.fillText('BILLETTERIE',24,103);
  }),
  projector: sprite(160,180,c=>{
    c.fillStyle='#3b4242';c.fillRect(37,65,95,57);c.fillStyle='#242b2a';c.fillRect(126,81,30,23);
    for(const x of [42,112]){ellipse(c,x,41,35,35,'#535e59');ellipse(c,x,41,28,28,'#1e2624');ellipse(c,x,41,6,6,'#a6a58c');for(let i=0;i<5;i++)ellipse(c,x+Math.cos(i*1.26)*17,41+Math.sin(i*1.26)*17,6,6,'#647068');}
    path(c,[[70,117],[79,117],[52,180],[41,180]],'#60655a');path(c,[[79,117],[89,117],[121,180],[109,180]],'#414c43');
  }),
  generator: sprite(150,190,c=>{
    c.fillStyle='#454e49';c.fillRect(10,7,130,180);c.fillStyle='#242e29';c.fillRect(20,18,110,159);
    for(let i=0;i<3;i++){c.fillStyle='#88967e';c.fillRect(35+i*29,44,16,49);c.fillStyle='#1b2721';c.fillRect(40+i*29,50,6,36);}
    c.fillStyle='#b4b697';c.font='11px monospace';c.textAlign='center';c.fillText('SECOURS',75,32);c.fillStyle='#9a4d37';c.fillRect(55,115,40,22);c.fillStyle='#e1b681';c.fillRect(63,122,24,7);
  }),
  exit: sprite(100,180,c=>{
    c.fillStyle='#242f28';c.fillRect(4,22,92,158);c.strokeStyle='#78836b';c.lineWidth=3;c.strokeRect(10,28,80,151);
    c.fillStyle='#909c72';c.fillRect(9,0,82,20);c.fillStyle='#12291e';c.font='bold 15px monospace';c.textAlign='center';c.fillText('SORTIE',50,16);c.fillStyle='#89957f';c.fillRect(20,112,60,5);
  })
};
const wallTexture = sprite(128,128,c=>{
  c.fillStyle='#7d7b69';c.fillRect(0,0,128,128);
  c.fillStyle='#4f2630';c.fillRect(0,78,128,50);
  c.fillStyle='#aa8760';c.fillRect(0,76,128,3);
  for(let i=0;i<4400;i++) {const v=randomArt();c.fillStyle=v<.5?'#07121416':'#eee7c70b';c.fillRect(randomArt()*128,randomArt()*128,randomArt()*3,randomArt()*3);}
  for(let i=0;i<14;i++){c.strokeStyle='#272b2644';c.lineWidth=1;c.beginPath();let x=randomArt()*128;c.moveTo(x,0);c.lineTo(x+4,randomArt()*50);c.lineTo(x-5,60+randomArt()*60);c.stroke();}
  c.fillStyle='#29291f';c.fillRect(0,125,128,3);
});
const posters = ['LA CONFESSION','LES ABSENTS','NE TE RETOURNE PAS'].map((title,i)=>sprite(128,184,c=>{
  c.fillStyle='#a5936d';c.fillRect(0,0,128,184);c.fillStyle='#171c1c';c.fillRect(3,3,122,178);
  c.drawImage(faces[i===1?'crawler':'nun'],15,8,98,130);
  c.fillStyle='#d8c4a4';c.font='bold 9px serif';c.textAlign='center';c.fillText(title,64,151);c.font='6px monospace';c.fillText('LE RIALTO · SÉANCE DE MINUIT',64,166);
}));
function sign(text) {
  return sprite(240,70,c=>{
    c.fillStyle='#91836b';c.fillRect(0,0,240,70);c.fillStyle='#272526';c.fillRect(3,3,234,64);
    c.fillStyle='#d2c09c';c.font='bold 18px monospace';c.textAlign='center';c.fillText(text,120,43,220);
  });
}

// Two running silhouettes alternate during a brief corridor crossing.
for(const [name,phase] of [['runner',1],['runnerStep',-1]]) {
  art[name]=sprite(180,280,c=>{
    const skin='#69736b', cloth='#3b4142';
    path(c,[[77,65],[114,65],[127,159],[67,160]],cloth);
    path(c,[[73,80],[49,119],[18,104],[12,116],[52,143],[89,106]],skin);
    path(c,[[108,83],[142,110],[168,83],[177,91],[148,132],[104,119]],skin);
    path(c,phase===1?[[78,151],[95,159],[65,208],[99,258],[83,267],[42,210]]:[[78,151],[94,158],[121,213],[160,224],[156,238],[101,225]],skin);
    path(c,phase===1?[[107,151],[121,158],[136,211],[166,224],[160,239],[115,225]]:[[107,151],[123,157],[88,210],[52,259],[38,250],[66,203]],skin);
    ellipse(c,96,43,25,33,'#7f8777');
    path(c,[[68,39],[74,10],[113,8],[129,38],[124,84],[110,64],[108,26],[86,25],[82,78],[64,98]],'#111719');
    ellipse(c,96,43,10,4,'#0a0f10');ellipse(c,104,43,2,2,'#c5c7ac');
    ellipse(c,101,59,7,10,'#0a0f10');
  });
}
