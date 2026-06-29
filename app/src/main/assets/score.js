// Meu Dia Pro v2.8 — Black Theme + Score Corrigido + Risco
(function(){
  if(window.__MDP28__) return; window.__MDP28__=true;

  const $=id=>document.getElementById(id);
  const today=()=>new Date().toISOString().slice(0,10);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const dbr=s=>{if(!s)return 'Sem data';const p=String(s).split('-');return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:s};
  const days=(a,b)=>Math.floor((new Date(a+'T00:00:00')-new Date(b+'T00:00:00'))/86400000);
  const peso=p=>({'Crítica':5,'Alta':4,'Média':2.5,'Baixa':1.4,'Opcional':0.6}[p]||2.5);
  const pr=p=>p==='Crítica'?'◇ Crítica':p==='Alta'?'△ Alta':p==='Média'?'○ Média':p==='Baixa'?'□ Baixa':'— Opcional';

  function getState(){
    try{
      if(window.state&&Array.isArray(window.state.tarefas)) return window.state;
      const raw=localStorage.getItem('meu_dia_pro_v2')||localStorage.getItem('tarefas_whatsapp_v1');
      const parsed=raw?JSON.parse(raw):{tarefas:[],projetos:[]};
      return Array.isArray(parsed)?{tarefas:parsed,projetos:[]}:parsed;
    }catch(e){return {tarefas:[],projetos:[]}}
  }

  function statusTxt(t){
    if(t.done) return 'Concluída';
    if(!t.data) return 'Sem data';
    const diff=days(t.data,today());
    if(diff<0) return `Atrasada ${Math.abs(diff)} dia(s)`;
    if(diff===0) return 'Entrega hoje';
    return `Faltam ${diff} dia(s)`;
  }

  function calcularScoreGeral(){
    const state=getState(), tarefas=state.tarefas||[], h=today();
    const abertas=tarefas.filter(t=>!t.done);
    const concluidas=tarefas.filter(t=>t.done);
    const atrasadas=abertas.filter(t=>t.data&&days(t.data,h)<0);
    const hoje=abertas.filter(t=>t.data===h);
    const criticas=abertas.filter(t=>t.prioridade==='Crítica');
    const pagamentos=abertas.filter(t=>t.pagamento==='nao');
    const noPrazo=concluidas.filter(t=>!t.data||!t.completedAt||String(t.completedAt).slice(0,10)<=t.data);

    let score=100, perdas=[];
    atrasadas.forEach(t=>{
      const d=Math.abs(days(t.data,h));
      const pts=Math.min(45,Math.round((8+d*4)*peso(t.prioridade)));
      score-=pts; perdas.push({tipo:'Atrasada',nome:t.nome,pontos:-pts,data:t.data,prioridade:t.prioridade,status:statusTxt(t)});
    });
    criticas.forEach(t=>{score-=10; perdas.push({tipo:'Crítica aberta',nome:t.nome,pontos:-10,data:t.data,prioridade:t.prioridade,status:statusTxt(t)})});
    hoje.forEach(t=>{const pts=Math.round(2*peso(t.prioridade));score-=pts;perdas.push({tipo:'Vence hoje',nome:t.nome,pontos:-pts,data:t.data,prioridade:t.prioridade,status:statusTxt(t)})});
    pagamentos.forEach(t=>{const pts=Number(t.valor||0)>0?8:5;score-=pts;perdas.push({tipo:'Pagamento pendente',nome:t.nome,pontos:-pts,data:t.data,prioridade:t.prioridade,status:statusTxt(t)})});

    const bonus=Math.min(20,Math.round(noPrazo.reduce((a,t)=>a+peso(t.prioridade)*1.5,0)));
    score+=bonus;
    score=Math.max(0,Math.min(100,Math.round(score)));

    return {score,tarefas,abertas,concluidas,atrasadas,hoje,criticas,pagamentos,noPrazo,bonus,perdas:perdas.sort((a,b)=>a.pontos-b.pontos)};
  }

  function injectTheme(){
    if($('mdp28-style')) return;
    const s=document.createElement('style'); s.id='mdp28-style';
    s.textContent=`
      :root{--bg:#000!important;--card:#070707!important;--text:#f5f5f5!important;--muted:#a3a3a3!important;--line:#222!important;--primary:#fff!important;--green:#fff!important;--red:#fff!important;--purple:#fff!important;--shadow:0 18px 42px rgba(0,0,0,.72)!important;--shadow2:0 8px 20px rgba(0,0,0,.55)!important}
      html,body,.themeDark{background:#000!important;color:#f5f5f5!important}body{background:radial-gradient(circle at top left,rgba(255,255,255,.055),transparent 28%),linear-gradient(180deg,#000,#050505 50%,#000)!important}
      .header,.card,.taskCard,.stat,.scoreMini,.templateCard,.achievement,.dayBox,.insight,.timelineItem,.v27Card,.v27Mission,.v27Hint,.v27Chart{background:linear-gradient(180deg,#0b0b0b,#050505)!important;border:1px solid #222!important;color:#f5f5f5!important;box-shadow:0 16px 38px rgba(0,0,0,.72)!important}
      .brand h1,.stat strong,.taskTitle,h1,h2,h3,b,strong,label{color:#fff!important}.brand p,.small,.muted,span{color:#a3a3a3}.tabs{background:rgba(0,0,0,.88)!important;border-bottom:1px solid #151515!important;backdrop-filter:blur(18px)}
      .tab{background:#080808!important;color:#e5e5e5!important;border:1px solid #242424!important;box-shadow:none!important}.tab.active,#tabScore{background:#fff!important;color:#000!important;border-color:#fff!important;box-shadow:0 10px 28px rgba(255,255,255,.08)!important}
      input,select,textarea{background:#050505!important;color:#f5f5f5!important;border:1px solid #252525!important;box-shadow:none!important}button{background:#121212!important;color:#f5f5f5!important;border:1px solid #2a2a2a!important;box-shadow:none!important}.btn-primary,.btn-green,.btn-purple,.btn-dark,.btn-light{background:#fff!important;color:#000!important;border:1px solid #fff!important}
      .bottomBar{background:rgba(0,0,0,.92)!important;border-top:1px solid #1f1f1f!important}.bottomInner{background:#050505!important;border:1px solid #222!important}table,td,th{background:#070707!important;color:#f5f5f5!important;border-color:#222!important}th{background:#101010!important}
      .badge,.v27Badge{background:#111!important;color:#f5f5f5!important;border:1px solid #333!important;box-shadow:none!important}.critica,.alta,.media,.baixa,.opcional{background:#111!important;color:#f5f5f5!important}.statusLate,.statusToday,.statusOk,.statusDone,.payNo,.payYes,.scoreDeltaPlus,.scoreDeltaMinus{color:#f5f5f5!important}
      .scoreHero{background:radial-gradient(circle at 18% 10%,rgba(255,255,255,.12),transparent 24%),linear-gradient(135deg,#000,#111 52%,#050505)!important;border:1px solid #2b2b2b!important;box-shadow:0 20px 48px rgba(0,0,0,.82)!important}.scoreRing{background:conic-gradient(#fff var(--scoreDeg),#1f1f1f 0)!important;box-shadow:inset 0 0 0 12px #111,0 22px 45px rgba(0,0,0,.55)!important}.scoreRingInner{background:#000!important;color:#fff!important;border:1px solid #2a2a2a}.progress,.scoreBar{background:#1b1b1b!important}.bar,.scoreBarFill,.v27Bar{background:linear-gradient(180deg,#fff,#888)!important}.reportBox{background:#030303!important;border:1px solid #222!important}.scoreNumber{color:#fff!important;text-shadow:0 0 18px rgba(255,255,255,.12)}
      .tab,.sectionTitle h2,.brand h1,.v27MissionIcon,.scoreHero h2,.taskCard,.badge,.small{filter:grayscale(1) saturate(0)!important}.riskPanel{border:1px solid #333!important;background:linear-gradient(180deg,#0b0b0b,#050505)!important}.riskItem{display:flex;justify-content:space-between;gap:10px;border:1px solid #222;border-radius:16px;padding:10px;margin-bottom:8px;background:#080808}.lineIcon{display:inline-grid;place-items:center;width:28px;height:28px;border:1.5px solid currentColor;border-radius:9px;font-size:0;color:#f5f5f5}.lineIcon:before{content:"";width:13px;height:13px;border:1.8px solid currentColor;border-radius:4px;display:block}
    `;
    document.head.appendChild(s); document.documentElement.classList.add('themeDark');
  }

  function ensureScoreUI(){
    const app=document.querySelector('.app'), dashboard=$('dashboard'); if(!app||!dashboard) return;
    const tabs=document.querySelector('.tabs');
    if(tabs&&!$('tabScore')){const b=document.createElement('button'); b.id='tabScore'; b.className='tab'; b.textContent='◇ Score'; b.onclick=()=>showTab('score',b); const configTab=[...tabs.children].find(x=>x.textContent.includes('⚙️')); tabs.insertBefore(b,configTab||null)}
    if(!$('scoreCardDashboard')){const card=document.createElement('div'); card.id='scoreCardDashboard'; card.className='card scoreHero'; card.innerHTML=`<div class="scoreContent"><div class="sectionTitle"><h2>◇ Score Geral</h2><button onclick="showTab('score')">Ver detalhes</button></div><div class="scoreRingWrap"><div class="scoreRing" id="dashScoreRing" style="--scoreDeg:0%"><div class="scoreRingInner" id="dashScoreRingText">0</div></div><div><div class="scoreNumber" id="dashScoreNumero">0</div><div class="scoreLabel" id="dashScoreNivel">Calculando...</div><p id="dashScoreResumo" style="max-width:680px;margin:8px 0 0;opacity:.9"></p></div></div></div>`; dashboard.insertBefore(card,dashboard.firstChild)}
    if(!$('score')){const sec=document.createElement('section'); sec.id='score'; sec.className='page hidden'; sec.innerHTML=`<div class="card scoreHero"><div class="scoreContent"><div class="sectionTitle"><h2>◇ Score Geral de Produtividade</h2><span class="small" style="color:white">0 a 100</span></div><div class="scoreRingWrap"><div class="scoreRing" id="scoreRing" style="--scoreDeg:0%"><div class="scoreRingInner" id="scoreRingText">0</div></div><div><div class="scoreNumber" id="scoreNumero">0</div><div class="scoreLabel" id="scoreNivel">Calculando...</div><p id="scoreResumo" style="max-width:680px;margin:8px 0 0;opacity:.9"></p></div></div></div></div><div class="scoreGrid"><div class="scoreMini"><strong id="scorePrazo">0</strong><span class="small">Concluídas no prazo</span></div><div class="scoreMini"><strong id="scoreAtrasos">0</strong><span class="small">Trabalhos atrasados</span></div><div class="scoreMini"><strong id="scoreCriticas">0</strong><span class="small">Críticas abertas</span></div><div class="scoreMini"><strong id="scoreGanho">0</strong><span class="small">Bônus no prazo</span></div></div><div class="card"><div class="sectionTitle"><h2>Composição da pontuação</h2><span class="small">corrigida</span></div><div class="tableWrap"><table class="scoreTable"><thead><tr><th>Item</th><th>Qtd</th><th>Impacto</th><th>Regra</th><th>Barra</th></tr></thead><tbody id="scoreTabela"></tbody></table></div></div><div class="card"><div class="sectionTitle"><h2>Ranking de perdas</h2><span class="small">o que derruba sua nota</span></div><div class="tableWrap"><table class="scoreTable"><thead><tr><th>Tarefa</th><th>Data</th><th>Prioridade</th><th>Status</th><th>Impacto</th></tr></thead><tbody id="scoreTarefas"></tbody></table></div></div>`; const config=$('config'); app.insertBefore(sec,config||null)}
  }

  function row(nome,qtd,impacto,regra,pct){const cls=impacto>=0?'scoreDeltaPlus':'scoreDeltaMinus', sinal=impacto>0?'+':''; return `<tr><td><b>${nome}</b></td><td>${qtd}</td><td class="${cls}">${sinal}${impacto}</td><td><span class="small">${regra}</span></td><td><div class="scoreBar"><div class="scoreBarFill" style="width:${Math.max(0,Math.min(100,pct))}%"></div></div></td></tr>`}

  function updateScore(){
    injectTheme(); ensureScoreUI(); const s=calcularScoreGeral();
    const set=(id,v)=>{const el=$(id); if(el) el.textContent=v}; const ring=(id,v)=>{const el=$(id); if(el) el.style.setProperty('--scoreDeg',v+'%')}; const nivel=s.score>=90?'Excelente':s.score>=75?'Muito bom':s.score>=60?'Atenção':s.score>=40?'Risco alto':'Crítico';
    ['scoreNumero','scoreRingText','dashScoreNumero','dashScoreRingText'].forEach(id=>set(id,s.score)); ring('scoreRing',s.score); ring('dashScoreRing',s.score); set('scoreNivel',nivel); set('dashScoreNivel',nivel); set('scorePrazo',s.noPrazo.length); set('scoreAtrasos',s.atrasadas.length); set('scoreCriticas',s.criticas.length); set('scoreGanho',s.bonus);
    const msg=`${s.atrasadas.length} atrasada(s), ${s.hoje.length} hoje, ${s.criticas.length} crítica(s).`; const r1=$('dashScoreResumo'), r2=$('scoreResumo'); if(r1) r1.textContent=msg; if(r2) r2.textContent='Atrasos agora derrubam a pontuação com força por dias e prioridade.';
    const atrasoPts=s.perdas.filter(x=>x.tipo==='Atrasada').reduce((a,x)=>a+Math.abs(x.pontos),0), critPts=s.perdas.filter(x=>x.tipo==='Crítica aberta').reduce((a,x)=>a+Math.abs(x.pontos),0), hojePts=s.perdas.filter(x=>x.tipo==='Vence hoje').reduce((a,x)=>a+Math.abs(x.pontos),0), pagPts=s.perdas.filter(x=>x.tipo==='Pagamento pendente').reduce((a,x)=>a+Math.abs(x.pontos),0);
    const tabela=$('scoreTabela'); if(tabela) tabela.innerHTML=[row('Bônus no prazo',s.noPrazo.length,s.bonus,'Concluir no prazo recupera pontos',s.bonus*5),row('Trabalhos atrasados',s.atrasadas.length,-atrasoPts,'Cada atraso pesa por dias e prioridade',100),row('Críticas abertas',s.criticas.length,-critPts,'Críticas abertas derrubam a nota',80),row('Tarefas de hoje',s.hoje.length,-hojePts,'Pendências do dia reduzem leve',60),row('Pagamentos pendentes',s.pagamentos.length,-pagPts,'Financeiro pendente pesa no score',70)].join('');
    const tarefas=$('scoreTarefas'); if(tarefas) tarefas.innerHTML=s.perdas.slice(0,20).map(x=>`<tr><td><b>${esc(x.nome)}</b><br><span class="small">${x.tipo}</span></td><td>${dbr(x.data)}</td><td>${pr(x.prioridade)}</td><td>${esc(x.status)}</td><td class="scoreDeltaMinus">${x.pontos}</td></tr>`).join('')||'<tr><td colspan="5">Nenhuma perda de pontuação agora.</td></tr>';
    riskPanel(s); try{localStorage.setItem('score_geral_atual',String(s.score)); if(window.AndroidApp&&AndroidApp.updateStatusNotification) window.AndroidApp.updateStatusNotification(`Score ${s.score}/100 • ${s.atrasadas.length} atrasada(s)`,`Score corrigido: ${s.score}/100\nAtrasadas: ${s.atrasadas.length}\nHoje: ${s.hoje.length}\nCríticas: ${s.criticas.length}`)}catch(e){}
  }

  function riskPanel(s){const dashboard=$('dashboard'); if(!dashboard) return; let panel=$('riskPanelV28'); if(!panel){panel=document.createElement('div'); panel.id='riskPanelV28'; panel.className='card riskPanel'; panel.innerHTML=`<div class="sectionTitle"><h2>◇ Alerta de Risco</h2><span class="small">score corrigido</span></div><div id="riskListV28"></div>`; const ref=$('painelV27')||$('scoreCardDashboard')||dashboard.firstChild; if(ref&&ref.nextSibling) dashboard.insertBefore(panel,ref.nextSibling); else dashboard.appendChild(panel)} const list=$('riskListV28'); if(list) list.innerHTML=s.perdas.slice(0,5).map(x=>`<div class="riskItem"><div><b>${esc(x.nome)}</b><br><span class="small">${x.tipo} • ${dbr(x.data)}</span></div><strong>${x.pontos}</strong></div>`).join('')||'<div class="riskItem"><div><b>Nenhum risco forte agora</b><br><span class="small">Continue concluindo no prazo.</span></div><strong>0</strong></div>'}

  function start(){if(typeof window.render==='function'&&!window.__MDP28_RENDER__){const old=window.render; window.render=function(){old();setTimeout(updateScore,0)}; window.__MDP28_RENDER__=true} updateScore(); setTimeout(updateScore,500); setTimeout(updateScore,1500); setInterval(updateScore,30000)}
  window.calcularScoreGeral=calcularScoreGeral;
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
