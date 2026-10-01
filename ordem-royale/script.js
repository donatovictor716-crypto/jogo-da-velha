const cards=[
{name:"Agente",icon:"🕵️",cost:2,hp:58,dmg:13,range:7,speed:1.0,rate:950,desc:"Combatente equilibrado",tag:"CORPO"},
{name:"Ocultista",icon:"🔮",cost:3,hp:40,dmg:21,range:14,speed:.72,rate:1100,desc:"Ataca de longe",tag:"DIST."},
{name:"Criatura",icon:"👁️",cost:4,hp:105,dmg:17,range:6,speed:.58,rate:1050,desc:"Muito resistente",tag:"TANQUE"},
{name:"Ritual",icon:"✦",cost:2,hp:1,dmg:30,range:0,speed:0,rate:0,desc:"Dano em área na torre",tag:"FEITIÇO"}
];

const arena=document.querySelector("#arena");
const hand=document.querySelector("#hand");
const unitsEl=document.querySelector("#units");
const effects=document.querySelector("#effects");
const energyEl=document.querySelector("#energy");
const energyFill=document.querySelector("#energyFill");
const msg=document.querySelector("#message");
const timerEl=document.querySelector("#timer");
const playerCrown=document.querySelector("#playerCrown");
const enemyCrown=document.querySelector("#enemyCrown");

let energy=5,time=180,ended=false,selected=null,nextId=0;
const towers={
 enemy:[{hp:160,max:160},{hp:160,max:160}],
 player:[{hp:160,max:160},{hp:160,max:160}]
};
const units=[];
let last=performance.now();
let energyClock=0;
let npcClock=0;
let gameClock=0;

function renderHand(){
  hand.innerHTML="";
  cards.forEach((c,i)=>{
    const b=document.createElement("button");
    b.className="card"+(selected===i?" selected":"");
    b.disabled=ended||energy<c.cost;
    b.innerHTML=`<span class="cost">${c.cost}</span><div class="icon">${c.icon}</div><b>${c.name}</b><small>${c.desc}</small><div class="stats"><span>${c.dmg} DANO</span><span>${c.cost} EN</span></div>`;
    b.onclick=()=>selectCard(i);
    hand.appendChild(b);
  });
}

function setEnergy(v){
  energy=Math.max(0,Math.min(10,v));
  energyEl.textContent=energy;
  energyFill.style.width=(energy*10)+"%";
  renderHand();
}

function selectCard(i){
  if(ended||energy<cards[i].cost)return;
  selected=selected===i?null:i;
  msg.textContent=selected===null?"Escolha uma carta e uma lane.":"Agora toque em uma lane para invocar "+cards[i].name+".";
  renderHand();
}

function laneButtons(){
  document.querySelectorAll(".deployment button").forEach(btn=>{
    btn.onclick=()=>deploySelected(Number(btn.dataset.lane));
  });
}
laneButtons();

function towerEl(side,lane){return document.querySelector(".tower."+side+(lane?" .right":" .left"))||document.querySelectorAll(".tower."+side)[lane]}

function updateTower(side,lane){
  const el=document.querySelectorAll(".tower."+side)[lane];
  const t=towers[side][lane];
  if(!el)return;
  el.querySelector("strong").textContent=Math.ceil(t.hp);
  el.querySelector("em").style.width=Math.max(0,t.hp/t.max*100)+"%";
  if(t.hp<=0)el.classList.add("destroyed");
}

function addHit(x,y,text,cls=""){
  const p=document.createElement("div");
  p.className="hit "+cls;p.style.left=x+"%";p.style.top=y+"%";p.textContent=text;
  effects.appendChild(p);setTimeout(()=>p.remove(),650);
}

function burst(x,y){
  const p=document.createElement("div");p.className="fx";p.style.left=x+"%";p.style.top=y+"%";
  effects.appendChild(p);setTimeout(()=>p.remove(),450);
}

function damageTower(side,lane,amount){
  if(ended)return;
  const t=towers[side][lane];
  if(t.hp<=0)return;
  t.hp=Math.max(0,t.hp-amount);
  updateTower(side,lane);
  addHit(lane?82:18,side==="enemy"?10:84,"-"+Math.round(amount));
  burst(lane?82:18,side==="enemy"?10:84);
  if(t.hp<=0){
    if(side==="enemy")enemyCrown.textContent=Number(enemyCrown.textContent)+1;
    else playerCrown.textContent=Number(playerCrown.textContent)+1;
    checkEnd();
  }
}

function checkEnd(){
  const e=towers.enemy.filter(t=>t.hp>0).length;
  const p=towers.player.filter(t=>t.hp>0).length;
  if(e===0||p===0){
    end(e===0?"Você venceu o duelo!":"O paranormal venceu o duelo!");
  }
}

function createUnit(card,lane,side="player"){
  const u={
    id:++nextId,card,lane,side,hp:card.hp,maxHp:card.hp,
    x:side==="player"?(lane?68:32):(lane?68:32),
    y:side==="player"?82:18,
    lastAttack:0,dead:false
  };
  const el=document.createElement("div");
  el.className="unit "+(side==="enemy"?"enemyUnit ":"")+(card.tag==="DIST."?"ranged":"");
  el.innerHTML=`<div class="hp"><i></i></div><span>${card.icon}</span><div class="unit-name">${card.name}</div>`;
  el.style.left=u.x+"%";el.style.top=u.y+"%";
  u.el=el;unitsEl.appendChild(el);units.push(u);
  return u;
}

function deploySelected(lane){
  if(selected===null||ended)return;
  const c=cards[selected];
  if(energy<c.cost)return;
  setEnergy(energy-c.cost);
  if(c.name==="Ritual"){
    castRitual(lane);
  }else{
    createUnit(c,lane,"player");
    msg.textContent=c.name+" invocado na lane "+(lane?"direita":"esquerda")+"!";
  }
  selected=null;
  renderHand();
}

function castRitual(lane){
  msg.textContent="Ritual lançado!";
  burst(lane?82:18,54);
  const targets=units.filter(u=>!u.dead&&u.side==="enemy"&&u.lane===lane);
  targets.forEach(u=>damageUnit(u,32));
  damageTower("enemy",lane,30);
}

function damageUnit(u,amount){
  if(u.dead)return;
  u.hp=Math.max(0,u.hp-amount);
  u.el.querySelector(".hp i").style.width=(u.hp/u.maxHp*100)+"%";
  u.el.classList.add("hitflash");setTimeout(()=>u.el?.classList.remove("hitflash"),180);
  const x=u.x,y=u.y;addHit(x,y-5,"-"+Math.round(amount));
  if(u.hp<=0)removeUnit(u);
}

function removeUnit(u){
  if(u.dead)return;
  u.dead=true;u.el.remove();
}

function nearestTarget(u){
  const enemySide=u.side==="player"?"enemy":"player";
  const alive=units.filter(v=>!v.dead&&v.side===enemySide&&v.lane===u.lane);
  if(!alive.length)return null;
  alive.sort((a,b)=>Math.abs(a.y-u.y)-Math.abs(b.y-u.y));
  return alive[0];
}

function towerTarget(u){
  const side=u.side==="player"?"enemy":"player";
  const t=towers[side][u.lane];
  if(t.hp<=0)return null;
  const towerY=side==="enemy"?10:90;
  return Math.abs(u.y-towerY)<14?t:null;
}

function moveUnit(u,dt){
  if(u.dead)return;
  const target=nearestTarget(u);
  const dist=target?Math.abs(target.y-u.y):999;
  const tower=towerTarget(u);
  const towerDist=tower?Math.abs(u.y-(u.side==="player"?10:90)):999;
  const speed=u.card.speed*dt*0.006;

  if(target && dist<=u.card.range){
    if(gameClock-u.lastAttack>=u.card.rate){
      u.lastAttack=gameClock;
      damageUnit(target,u.card.dmg);
      burst(u.x,u.y);
    }
    return;
  }
  if(!target && tower && towerDist<=u.card.range+4){
    if(gameClock-u.lastAttack>=u.card.rate){
      u.lastAttack=gameClock;
      damageTower(u.side==="player"?"enemy":"player",u.lane,u.card.dmg);
      burst(u.x,u.y);
    }
    return;
  }

  const dir=u.side==="player"?-1:1;
  u.y+=dir*speed;
  u.y=Math.max(10,Math.min(90,u.y));
  u.el.style.top=u.y+"%";
}

function npcSpawn(){
  if(ended)return;
  const affordable=cards.filter(c=>c.name!=="Ritual"&&c.cost<=5);
  const c=affordable[Math.floor(Math.random()*affordable.length)];
  const lane=Math.random()<.5?0:1;
  createUnit(c,lane,"enemy");
}

function updateNpc(){
  if(gameClock-npcClock<5200)return;
  npcClock=gameClock;
  npcSpawn();
}

function update(dt){
  if(ended)return;
  gameClock+=dt;
  energyClock+=dt;
  if(energyClock>=850){
    energyClock=0;
    if(energy<10)setEnergy(energy+1);
  }
  updateNpc();
  units.slice().forEach(u=>moveUnit(u,dt));
}

function tickClock(){
  if(ended)return;
  time--;
  const m=String(Math.floor(time/60)).padStart(2,"0");
  const s=String(time%60).padStart(2,"0");
  timerEl.textContent=m+":"+s;
  if(time<=30)timerEl.classList.add("danger");
  if(time<=0){
    const p=towers.player.reduce((a,t)=>a+t.hp,0);
    const e=towers.enemy.reduce((a,t)=>a+t.hp,0);
    end(p>e?"Você venceu no tempo!":e>p?"O paranormal venceu no tempo!":"Empate no ritual!");
  }
}

function end(text){
  ended=true;selected=null;
  msg.textContent=text;msg.classList.add("win");
  renderHand();
}

document.querySelector("#reset").onclick=()=>location.reload();
setInterval(tickClock,1000);
function loop(now){const dt=Math.min(40,now-last);last=now;update(dt);requestAnimationFrame(loop)}
renderHand();setEnergy(5);requestAnimationFrame(loop);
