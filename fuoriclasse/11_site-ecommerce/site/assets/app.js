
const KEY='fc-bag';
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY))||[]}catch(e){return []}};
const save=b=>{try{localStorage.setItem(KEY,JSON.stringify(b))}catch(e){}};
let bag=load();
const eur=n=>'€ '+n.toLocaleString('fr-BE');
function renderBag(){
  document.querySelectorAll('[data-bagcount]').forEach(e=>e.textContent=bag.reduce((a,i)=>a+i.q,0));
  const box=document.querySelector('.drawer .items'); if(!box) return;
  box.innerHTML=bag.length?bag.map((i,k)=>`<div class="it"><img src="${i.img}" alt=""><div><div class="wide" style="font-size:11px">${i.name}</div><div class="mono" style="color:var(--talpa);margin-top:4px">${i.color} · ${i.size}</div><button class="mono" data-rm="${k}" style="margin-top:8px;text-decoration:underline">Retirer</button></div><div class="mono">${eur(i.price*i.q)}</div></div>`).join(''):'<p style="color:var(--grafite)">Votre sélection est vide.</p>';
  const t=document.querySelector('[data-total]'); if(t) t.textContent=eur(bag.reduce((a,i)=>a+i.price*i.q,0));
  box.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{bag.splice(+b.dataset.rm,1);save(bag);renderBag();});
}
function openBag(o){document.querySelector('.drawer').classList.toggle('open',o);document.querySelector('.veil').classList.toggle('open',o);}
document.addEventListener('click',e=>{
  if(e.target.closest('[data-openbag]')){e.preventDefault();openBag(true);}
  if(e.target.closest('[data-closebag]')||e.target.classList.contains('veil'))openBag(false);
  const f=e.target.closest('[data-filter]');
  if(f){document.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',x===f));
    document.querySelectorAll('.grid .card').forEach(c=>c.style.display=(f.dataset.filter==='all'||c.dataset.fam===f.dataset.filter)?'':'none');}
});
const P=window.PRODUCT;
if(P){
  let color=P.colors[0], size=null;
  const main=document.querySelectorAll('[data-main]');
  document.querySelectorAll('button.c').forEach(b=>b.onclick=()=>{color=P.colors[+b.dataset.i];
    document.querySelectorAll('button.c').forEach(x=>x.setAttribute('aria-pressed',x===b));
    document.querySelector('[data-colorname]').textContent=color.name;
    main.forEach((m,k)=>{const src=k===0?color.front:(color.back||null); if(src) m.src=src;});});
  document.querySelectorAll('button.s').forEach(b=>b.onclick=()=>{size=b.textContent;document.querySelectorAll('button.s').forEach(x=>x.setAttribute('aria-pressed',x===b));
    document.querySelector('[data-add]').textContent='Ajouter au panier';});
  document.querySelector('[data-add]').onclick=()=>{
    if(!size){document.querySelector('[data-add]').textContent='Choisissez une taille';return;}
    bag.push({name:P.name,price:P.price,color:color.name,size,q:1,img:new URL(color.front,location.href).href});save(bag);renderBag();openBag(true);};
}
renderBag();
