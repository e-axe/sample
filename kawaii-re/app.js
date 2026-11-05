(() => {
  'use strict';
  const data=JSON.parse(document.getElementById('performance-data').textContent);
  document.documentElement.classList.add('js');
  document.body.classList.add('ready');
  const filter=document.getElementById('cast-filter');
  const results=document.getElementById('show-results');
  const heading=document.getElementById('results-heading');
  const list=document.getElementById('result-list');
  const status=document.getElementById('result-status');
  const nav=document.getElementById('navigation');
  const menu=document.querySelector('.menu-toggle');
  const label=s=>`12/${s.day}（${s.weekday}）${s.time}`;
  const selectedName=id=>data.cast.find(c=>c.id===id);
  function closeMenu(){menu.setAttribute('aria-expanded','false');nav.classList.remove('is-open');}
  menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-open',open);});
  nav.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus();}});
  document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))closeMenu();});
  function render(castId='',showId=null){
    const cast=selectedName(castId);
    const shows=data.shows.filter(s=>(!cast||cast.shows.includes(s.id))&&(!showId||s.id===showId));
    document.querySelectorAll('[data-show]').forEach(button=>{
      const id=Number(button.dataset.show);button.setAttribute('aria-pressed',String(showId===id));
      button.classList.toggle('is-muted',Boolean(cast&&!cast.shows.includes(id)));
    });
    results.hidden=false;
    heading.textContent=cast?`${cast.name}さんの出演公演`:'公演の出演者';
    status.textContent=cast?`${shows.length}公演に出演します。日時と券種を確認してからお進みください。`:'選択した公演の出演者をご確認ください。';
    list.replaceChildren();
    shows.forEach(show=>{
      const article=document.createElement('article');article.className='result-show';
      const h=document.createElement('h4');h.textContent=`${label(show)} ｜ 本番${show.id}`;article.append(h);
      const p=document.createElement('p');
      data.cast.filter(c=>c.shows.includes(show.id)).forEach((person,index)=>{
        if(index)p.append(' ／ ');
        const span=document.createElement(person.id===castId?'strong':'span');span.textContent=person.name;p.append(span);
      });
      article.append(p);list.append(article);
    });
  }
  filter.addEventListener('change',()=>{if(filter.value){render(filter.value);}else{reset();}});
  document.querySelectorAll('[data-cast]').forEach(link=>link.addEventListener('click',()=>{filter.value=link.dataset.cast;render(filter.value);requestAnimationFrame(()=>heading.focus({preventScroll:true}));}));
  document.querySelectorAll('[data-show]').forEach(button=>button.addEventListener('click',()=>{filter.value='';render('',Number(button.dataset.show));}));
  function reset(){filter.value='';results.hidden=true;list.replaceChildren();document.querySelectorAll('[data-show]').forEach(b=>{b.setAttribute('aria-pressed','false');b.classList.remove('is-muted');});}
  document.getElementById('reset-filter').addEventListener('click',()=>{reset();filter.focus();});
  document.querySelector('[data-expand-cast]').addEventListener('click',()=>{document.getElementById('all-cast').open=true;});
  const saleAt=Date.parse(data.saleAt);
  function updateSale(){
    const live=Date.now()>=saleAt;
    document.querySelectorAll('[data-sale-link]').forEach(link=>{
      link.setAttribute('aria-disabled',String(!live));
      link.href=live?data.ticketUrl:'#ticket';
    });
    document.querySelectorAll('[data-sale-label]').forEach(el=>el.textContent=live?'チケット販売中｜先着順':'11/12（木）22:00 発売開始｜先着順');
    document.querySelectorAll('[data-sale-note]').forEach(el=>el.textContent=live?'販売状況・残席はカンフェティでご確認ください。':'※発売日時からチケット販売ページにアクセスできます。');
  }
  document.querySelectorAll('[data-sale-link]').forEach(link=>link.addEventListener('click',e=>{updateSale();if(Date.now()<saleAt)e.preventDefault();}));
  updateSale();setInterval(updateSale,1000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateSale();});
})();
