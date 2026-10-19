document.querySelectorAll(".draggable").forEach(el=>{let d=false,sx=0,sy=0,bx=0,by=0,x=0,y=0;const r=Number(el.dataset.rotation||0);const down=e=>{d=true;el.classList.add("dragging");const p=e.touches?e.touches[0]:e;sx=p.clientX;sy=p.clientY;bx=x;by=y};const move=e=>{if(!d)return;const p=e.touches?e.touches[0]:e;x=bx+p.clientX-sx;y=by+p.clientY-sy;el.style.transform=`translate(${x}px,${y}px) rotate(${r}deg)`};const up=()=>{d=false;el.classList.remove("dragging")};el.addEventListener("mousedown",down);el.addEventListener("touchstart",down,{passive:true});window.addEventListener("mousemove",move);window.addEventListener("touchmove",move,{passive:true});window.addEventListener("mouseup",up);window.addEventListener("touchend",up)});
const modal=document.querySelector("#modal"),mn=document.querySelector(".modal-name");document.querySelectorAll("[data-modal]").forEach(b=>b.onclick=()=>{mn.textContent=b.dataset.modal;modal.classList.add("open")});document.querySelector(".close").onclick=()=>modal.classList.remove("open");modal.onclick=e=>{if(e.target===modal)modal.classList.remove("open")};
const nav=document.querySelector(".nav"),hero=document.querySelector(".hero"),dark=document.querySelectorAll(".project.dark,.contact");function theme(){let on=false;[hero,...dark].forEach(s=>{const r=s.getBoundingClientRect();if(r.top<=32&&r.bottom>=32)on=true});nav.classList.toggle("nav-on-dark",on);nav.classList.toggle("nav-on-light",!on)}theme();addEventListener("scroll",theme,{passive:true});
// Prevent native browser image dragging (the translucent duplicate/ghost).
document.querySelectorAll("img").forEach(img => {
  img.setAttribute("draggable","false");
  img.addEventListener("dragstart", e => e.preventDefault());
});


// V18 — WORK accordion. Only one project stays open.
// The open project's header remains sticky under the main navigation.
document.querySelectorAll(".work-toggle").forEach(toggle => {
  toggle.addEventListener("click", () => {
    const item = toggle.closest(".work-item");
    const wasOpen = item.classList.contains("open");

    document.querySelectorAll(".work-item.open").forEach(openItem => {
      if (openItem !== item) {
        openItem.classList.remove("open");
        openItem.querySelector(".work-toggle").setAttribute("aria-expanded","false");
      }
    });

    if (wasOpen) {
      // Collapse at the clicked header, even when the user was at the very bottom.
      const header = item.querySelector('.work-toggle');
      const topBefore = header.getBoundingClientRect().top + window.scrollY;
      item.classList.remove('open');
      toggle.setAttribute('aria-expanded','false');
      // Do not animate across a collapsing multi-screen iframe.
      const topAfter = header.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({top:Math.max(0,topAfter-68),behavior:'instant'});
      requestAnimationFrame(()=>window.scrollTo({top:Math.max(0,header.getBoundingClientRect().top+window.scrollY-68),behavior:'instant'}));
    } else {
      item.classList.add('open');
      toggle.setAttribute('aria-expanded','true');
      requestAnimationFrame(() => {
        const y = item.getBoundingClientRect().top + window.scrollY - 62;
        window.scrollTo({top:y, behavior:'smooth'});
      });
    }
  });
});

// V51 — One click reveals a miniature real newsletter above its envelope;
// clicking the miniature enlarges it in a dismissible overlay.
(() => {
 const expanded=document.querySelector('#newsletter-expanded');if(!expanded)return;
 const title=expanded.querySelector('.newsletter-expanded-title');
 const host=expanded.querySelector('.newsletter-inline');
 const shadow=host.attachShadow({mode:'open'});
 const envelopes=[...document.querySelectorAll('.start-case .envelope')];
 const grid=document.querySelector('.start-case .envelopes');
 let active=null;
 const previews=new Map();
 function render(name){
   const html=(window.START_NEWSLETTER_HTML||{})[name];if(!html)return;
   const doc=new DOMParser().parseFromString(html,'text/html');
   const style=document.createElement('style');
   style.textContent=':host{display:block;width:100%;background:#000;color:#fff}.email{max-width:670px!important;margin:0 auto!important}';
   shadow.replaceChildren(style,...Array.from(doc.head.querySelectorAll('style')).map(x=>x.cloneNode(true)),...Array.from(doc.body.childNodes).map(x=>x.cloneNode(true)));
 }
 function closeFull(){expanded.hidden=true;document.body.classList.remove('crm-modal-open');}
 function reset(){closeFull();shadow.replaceChildren();active=null;envelopes.forEach(e=>{e.classList.remove('open');e.setAttribute('aria-expanded','false');e.querySelector('.env-action').textContent='OPEN ↗'});previews.forEach(p=>p.hidden=true);}
 function enlarge(name){title.textContent=name+' / ORIGINAL NEWSLETTER';render(name);expanded.hidden=false;document.body.classList.add('crm-modal-open');expanded.querySelector('.newsletter-collapse').focus();}
 envelopes.forEach(env=>{
   const name=env.dataset.newsletter;
   env.setAttribute('aria-expanded','false');env.querySelector('.env-action').textContent='OPEN ↗';
   const preview=document.createElement('div');preview.className='crm-letter-preview';preview.hidden=true;
   preview.innerHTML='<button type="button" class="crm-preview-expand" aria-label="Enlarge '+name+' newsletter"><span>VIEW FULL NEWSLETTER ↗</span></button>';
   const iframe=document.createElement('iframe');iframe.className='crm-preview-frame';iframe.title=name+' newsletter miniature';iframe.setAttribute('tabindex','-1');iframe.setAttribute('aria-hidden','true');iframe.setAttribute('scrolling','no');iframe.srcdoc=(window.START_NEWSLETTER_HTML||{})[name]||'';
   preview.prepend(iframe);env.after(preview);previews.set(env,preview);
   env.addEventListener('click',()=>{
     if(active===env){reset();return;}
     reset();active=env;env.classList.add('open');env.setAttribute('aria-expanded','true');env.querySelector('.env-action').textContent='CLOSE ×';preview.hidden=false;
   });
   preview.querySelector('.crm-preview-expand').addEventListener('click',()=>enlarge(name));
 });
 expanded.querySelector('.newsletter-collapse').addEventListener('click',closeFull);
 expanded.addEventListener('click',e=>{if(e.target===expanded)closeFull();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!expanded.hidden)closeFull();});
})();

// V36 — Sliding carousel with continuous horizontal motion.
(() => {
 const carousel=document.querySelector('.start-case .post-carousel');if(!carousel)return;
 const track=carousel.querySelector('.post-triptych');const counter=document.querySelector('.start-case .post-carousel-counter');
 const images=Array.from({length:9},(_,i)=>'assets/start-organic-'+String(i+1).padStart(2,'0')+'.jpg');
 let page=0,busy=false;
 const makeCard=i=>{const card=document.createElement('button');card.type='button';card.dataset.post=String(i);card.dataset.modal='START CAMPAIGN VISUAL';card.setAttribute('aria-label','View campaign image '+(i+1));card.style.backgroundImage='url("'+images[i]+'")';const span=document.createElement('span');card.append(span);return card};
 const setCounter=()=>{if(counter)counter.textContent=String(page*3+1).padStart(2,'0')+' — '+String(page*3+3).padStart(2,'0')+' / 09'};
 track.replaceChildren(...[0,1,2].map(i=>makeCard(i)));setCounter();
 function move(dir){if(busy)return;busy=true;const next=(page+dir+3)%3;const current=[...track.children];const incoming=[0,1,2].map(i=>makeCard(next*3+i));
 const width=track.getBoundingClientRect().width;const gap=parseFloat(getComputedStyle(track).gap)||0;const step=width+gap;
 track.style.transition='none';track.style.transform='translateX(0)';
 if(dir>0){track.append(...incoming)}else{track.prepend(...incoming);track.style.transform='translateX(-'+step+'px)'}
 requestAnimationFrame(()=>requestAnimationFrame(()=>{track.style.transition='transform 540ms cubic-bezier(.22,1,.36,1)';track.style.transform=dir>0?'translateX(-'+step+'px)':'translateX(0)'}));
 const finish=()=>{track.removeEventListener('transitionend',finish);track.replaceChildren(...incoming);track.style.transition='none';track.style.transform='translateX(0)';page=next;setCounter();busy=false};
 track.addEventListener('transitionend',finish,{once:true});
 }
 carousel.querySelector('.post-prev').addEventListener('click',()=>move(-1));carousel.querySelector('.post-next').addEventListener('click',()=>move(1));
})();

// V33: actual image viewer for campaign visuals (not the generic placeholder).
(() => {
 const modal=document.querySelector('#modal'); if(!modal)return;
 const image=document.createElement('img');image.className='start-modal-image';image.alt='START campaign visual';
 modal.appendChild(image);
 document.querySelector('.start-case .post-triptych')?.addEventListener('click',event=>{
  const card=event.target.closest('button[data-post]');if(!card)return;
  {
   const n=Number(card.dataset.post)+1;image.src='assets/start-organic-'+String(n).padStart(2,'0')+'.jpg';
   modal.classList.add('start-image-open');
  }
 });
 const close=()=>{modal.classList.remove('start-image-open');image.removeAttribute('src')};
 modal.querySelector('.close')?.addEventListener('click',close);
 modal.addEventListener('click',e=>{if(e.target===modal)close()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){modal.classList.remove('open');close()}});
})();

// V41 — launch carousel with actual campaign assets.
(()=>{const root=document.querySelector('.start-case .paid-carousel');if(!root)return;const img=root.querySelector('img'),count=root.querySelector('.paid-count');let n=0;const render=()=>{img.src='assets/paid-drop-'+String(n+1).padStart(2,'0')+'.webp';img.alt='START launch carousel, image '+(n+1)+' of 6';count.textContent=String(n+1).padStart(2,'0')+' / 06'};root.querySelector('.paid-prev').addEventListener('click',()=>{n=(n+5)%6;render()});root.querySelector('.paid-next').addEventListener('click',()=>{n=(n+1)%6;render()})})();

// V53 — self-contained anniversary carousel controls. No START behaviour changed.
(()=>{const sets={campaign:['ann-candles.webp','ann-lighter.webp','ann-matches.webp','ann-campaign-04.webp'],giveaway:['ann-giveaway-01.webp','ann-giveaway-02.webp','ann-giveaway-03.webp','ann-giveaway-04.webp','ann-giveaway-05.mp4','ann-giveaway-06.webp']};document.querySelectorAll('[data-ann-carousel]').forEach(root=>{const slides=sets[root.dataset.annCarousel],stage=root.querySelector('.ann-slide'),counter=root.querySelector('.ann-counter');let index=0;function render(){const file=slides[index],path='assets/'+file;const el=document.createElement(file.endsWith('.mp4')?'video':'img');if(el.tagName==='VIDEO'){el.src=path;el.controls=true;el.playsInline=true;el.preload='metadata'}else{el.src=path;el.alt='Anniversary carousel image '+(index+1)}stage.replaceChildren(el);stage.classList.toggle('is-first-slide',root.dataset.annCarousel==='campaign'&&index===0);counter.textContent=String(index+1).padStart(2,'0')+' / '+String(slides.length).padStart(2,'0')}root.querySelector('.ann-prev').addEventListener('click',()=>{index=(index+slides.length-1)%slides.length;render()});root.querySelector('.ann-next').addEventListener('click',()=>{index=(index+1)%slides.length;render()});render()})})();


// V54 — single anniversary CRM email
(()=>{const button=document.querySelector('.ann-newsletter-toggle');if(!button)return;const panel=document.querySelector('.ann-newsletter-content');button.addEventListener('click',()=>{const show=panel.hidden;panel.hidden=!show;button.setAttribute('aria-expanded',String(show));button.innerHTML=show?'CLOSE NEWSLETTER <span>×</span>':'VIEW THE NEWSLETTER <span>↗</span>';});})();

// OWN IT — vertical scroll drives one uninterrupted horizontal image strip.
(() => {
  const section=document.querySelector('.own-scroll-story');
  if(!section)return;
  const sticky=section.querySelector('.own-scroll-sticky');
  const track=section.querySelector('.own-scroll-track');
  const images=[...track.querySelectorAll('img')];
  let distance=0, travel=0, raf=0;
  function measure(){
    distance=Math.max(0,track.scrollWidth-sticky.clientWidth);
    // Provide enough scroll to see every panel at a comfortable pace.
    section.style.height=(sticky.clientHeight+distance)+'px';
    travel=Math.max(1,section.offsetHeight-sticky.clientHeight);
    update();
  }
  function update(){
    const rect=section.getBoundingClientRect();
    const progress=Math.max(0,Math.min(1,-rect.top/travel));
    track.style.transform=`translate3d(${-distance*progress}px,0,0)`;
    const counter=section.querySelector('.own-scroll-counter');
    if(counter)counter.textContent=String(Math.min(images.length,Math.floor(progress*(images.length-1)+.5)+1)).padStart(2,'0')+' / '+String(images.length).padStart(2,'0');
  }
  section.querySelectorAll('.own-scroll-controls button').forEach((button,index)=>button.addEventListener('click',()=>{
    const rect=section.getBoundingClientRect();
    const progress=Math.max(0,Math.min(1,-rect.top/travel));
    const step=1/Math.max(1,images.length-1);
    const target=index===0?Math.max(0,Math.ceil(progress/step-0.001)*step-step):Math.min(1,Math.floor(progress/step+0.001)*step+step);
    window.scrollTo({top:window.scrollY+rect.top+target*travel,behavior:'smooth'});
  }));
  function tick(){if(!raf)raf=requestAnimationFrame(()=>{raf=0;update()})}
  images.forEach(img=>{if(!img.complete)img.addEventListener('load',measure,{once:true})});
  window.addEventListener('resize',measure,{passive:true});
  window.addEventListener('scroll',tick,{passive:true});
  // An initially collapsed project has zero dimensions; measure after it opens.
  const observer=new ResizeObserver(()=>{if(sticky.clientWidth>0)measure()});observer.observe(sticky);
  measure();
})();

// V62 — discoverable navigation for both paid-social carousels.
document.querySelectorAll('.work-item[data-project="02"] .own-ads-wrap').forEach(wrap=>{
  const strip=wrap.querySelector('.own-ads');
  wrap.querySelectorAll('.own-ads-arrow').forEach(btn=>btn.addEventListener('click',()=>{
    const item=strip.querySelector('img,video');
    if(item)strip.scrollBy({left:Number(btn.dataset.direction)*(item.getBoundingClientRect().width+8),behavior:'smooth'});
  }));
});
