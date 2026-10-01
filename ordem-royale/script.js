const cards=[
{name:"Agente",icon:"🕵️",cost:2,hp:55,dmg:12,desc:"Atacante equilibrado"},
{name:"Ocultista",icon:"🔮",cost:3,hp:42,dmg:20,desc:"Dano paranormal"},
{name:"Criatura",icon:"👁️",cost:4,hp:90,dmg:17,desc:"Resistente"},
{name:"Ritual",icon:"✦",cost:2,hp:1,dmg:35,desc:"Golpe direto na torre"}
];
const hand=document.querySelector("#hand"),units=document.querySelector("#units"),effects=document.querySelector("#effects"),energyEl=document.querySelector("#energy"),msg=document.querySelector("#message"),timerEl=document.querySelector("#timer");
let energy=5,time=180,ended=false,unitId=0,playerTowers=[100,100],enemyTowers=[100,100];

function renderHand(){hand.innerHTML="";cards.forEach((c,i)=>{const b=document.createElement("button");b.className="card";b.disabled=ended||energy<c.cost;b.innerHTML='<span class="cost">'+c.cost+'</span><div class="icon">'+c.icon+'</div><b>'+c.name+'</b><small>'+c.desc+'</small>';b.onclick=()=>playCard(i);hand.appendChild(b)})}
function setEnergy(v){energy=Math.max(0,Math.min(10,v));energyEl.textContent=energy;document.querySelector(".energy i").style.width=(energy*10)+"%";renderHand()}
function popup(x,y,text){const p=document.createElement("div");p.className="hit";p.style.left=x+"%";p.style.top=y+"%";p.textContent=text;effects.appendChild(p);setTimeout(()=>p.remove(),500)}
function tower(side,index,damage){const arr=side==="enemy"?enemyTowers:playerTowers;arr[index]=Math.max(0,arr[index]-damage);const els=document.querySelectorAll(".tower."+side);els[index].querySelector("b").textContent=arr[index];popup(index?82:18,side==="enemy"?15:82,"-"+damage);if(arr[index]<=0)end(side==="enemy"?"Você venceu!":"O NPC venceu!")}
function spawn(c,lane){const u=document.createElement("div");u.className="unit";u.id="u"+(++unitId);u.innerHTML='<div class="hp"><i></i></div>'+c.icon;u.style.left=(lane?68:24)+"%";u.style.top="72%";units.appendChild(u);let hp=c.hp;let y=72;const step=setInterval(()=>{if(ended){clearInterval(step);u.remove();return}y-=5;u.style.top=y+"%";if(y<=23){clearInterval(step);u.remove();tower("enemy",lane,c.dmg);return}if(Math.random()<.28){hp-=10;u.querySelector(".hp i").style.width=Math.max(0,hp/c.hp*100)+"%";if(hp<=0){clearInterval(step);u.remove()}}},650)}
function playCard(i){const c=cards[i];if(energy<c.cost||ended)return;setEnergy(energy-c.cost);msg.textContent=c.name+" invocado!";if(c.name==="Ritual"){tower("enemy",Math.random()>.5?1:0,c.dmg);return}spawn(c,Math.random()>.5?1:0)}
function npc(){if(ended)return;const lane=Math.random()>.5?1:0;const damage=8+Math.floor(Math.random()*9);tower("player",lane,damage);msg.textContent="O paranormal atacou sua torre!";setTimeout(()=>{if(!ended)msg.textContent="Escolha uma carta para invocar."},800)}
function end(text){ended=true;msg.textContent=text;msg.classList.add("win");renderHand()}
function tick(){if(ended)return;time--;const m=String(Math.floor(time/60)).padStart(2,"0"),s=String(time%60).padStart(2,"0");timerEl.textContent=m+":"+s;if(time<=0){const p=playerTowers.reduce((a,b)=>a+b,0),e=enemyTowers.reduce((a,b)=>a+b,0);end(e<p?"Você venceu no tempo!":p<e?"O NPC venceu no tempo!":"Empate!");return}if(energy<10)setEnergy(energy+1);if(time%5===0)npc()}
document.querySelector("#reset").onclick=()=>location.reload();
setInterval(tick,1000);renderHand();setEnergy(5);