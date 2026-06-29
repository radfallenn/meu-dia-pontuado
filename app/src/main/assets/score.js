// Meu Dia Pro v2.5 - Score visível e garantido
(function(){
  function byId(id){return document.getElementById(id)}
  function safeState(){return window.state||{tarefas:[],projetos:[]}}
  function today(){return typeof hojeStr==='function'?hojeStr():new Date().toISOString().slice(0,10)}
  function dbr(s){return typeof dataBR==='function'?dataBR(s):(s||'Sem data')}
  function escapeTxt(s){return typeof esc==='function'?esc(s):String(s??'')}
  function priorityIcon(p){return typeof prIcon==='function'?prIcon(p):(p||'Média')}
  function taskStatus(t){return typeof status==='function'?status(t).txt:(t.done?'Concluída':'Aberta')}
  function daysBetween(a,b){return typeof diasEntre==='function'?diasEntre(a,b):Math.floor((new Date(a)-new Date(b))/(86400000))}

  function scorePesoPrioridade(p){return {'Crítica':4,'Alta':3,'Média':2,'Baixa':1,'Opcional':0.5}[p]||2}

  function calcularScoreGeral(){
    const tarefas=safeState().tarefas||[], abertas=tarefas.filter(t=>!t.done), concluidas=tarefas.filter(t=>t.done), hoje=today();
    const atrasadas=abertas.filter(t=>t.data&&daysBetween(t.data,hoje)<0), vencemHoje=abertas.filter(t=>t.data===hoje), criticas=abertas.filter(t=>t.prioridade==='Crítica'), pagamentos=abertas.filter(t=>t.pagamento==='nao');
    const concluidasNoPrazo=concluidas.filter(t=>!t.data||!t.completedAt||String(t.completedAt).slice(0,10)<=t.data);
    const concluidasAtrasadas=concluidas.filter(t=>t.data&&t.completedAt&&String(t.completedAt).slice(0,10)>t.data);
    let perdaAtrasos=0,perdaCriticas=0,perdaHoje=0,perdaPagamentos=0,ganhoPrazo=0,perdaConcluidasAtrasadas=0;
    atrasadas.forEach(t=>{const dias=Math.abs(daysBetween(t.data,hoje));perdaAtrasos+=Math.min(35,dias*scorePesoPrioridade(t.prioridade)*1.9)});
    criticas.forEach(()=>perdaCriticas+=5);vencemHoje.forEach(t=>perdaHoje+=scorePesoPrioridade(t.prioridade)*0.9);pagamentos.forEach(t=>perdaPagamentos+=Math.min(9,2+(Number(t.valor||0)>0?2:0)));concluidasNoPrazo.forEach(t=>ganhoPrazo+=scorePesoPrioridade(t.prioridade)*1.4);concluidasAtrasadas.forEach(t=>perdaConcluidasAtrasadas+=scorePesoPrioridade(t.prioridade)*0.8);
    let score=100-perdaAtrasos-perdaCriticas-perdaHoje-perdaPagamentos-perdaConcluidasAtrasadas+Math.min(20,ganhoPrazo);score=Math.max(0,Math.min(100,Math.round(score)));
    return {score,abertas,concluidas,atrasadas,vencemHoje,criticas,pagamentos,concluidasNoPrazo,concluidasAtrasadas,perdaAtrasos:Math.round(perdaAtrasos),perdaCriticas:Math.round(perdaCriticas),perdaHoje:Math.round(perdaHoje),perdaPagamentos:Math.round(perdaPagamentos),ganhoPrazo:Math.round(Math.min(20,ganhoPrazo)),perdaConcluidasAtrasadas:Math.round(perdaConcluidasAtrasadas),liquidoHoje:Math.round(Math.min(20,ganhoPrazo)-perdaHoje-perdaAtrasos-perdaCriticas)};
  }

  function nivelScore(s){if(s>=90)return 'Excelente — rotina sob controle';if(s>=75)return 'Muito bom — poucas pendências pesadas';if(s>=60)return 'Atenção — atrasos já estão pesando';if(s>=40)return 'Risco alto — priorize atrasadas e críticas';return 'Crítico — foque nas tarefas vencidas'}
  function impactoTarefa(t){if(t.done){if(t.data&&t.completedAt&&String(t.completedAt).slice(0,10)>t.data)return -Math.round(scorePesoPrioridade(t.prioridade));return Math.round(scorePesoPrioridade(t.prioridade)*2)}if(t.data&&daysBetween(t.data,today())<0){const dias=Math.abs(daysBetween(t.data,today()));return -Math.round(Math.min(35,dias*scorePesoPrioridade(t.prioridade)*1.9))}if(t.prioridade==='Crítica')return -5;if(t.data===today())return -Math.round(scorePesoPrioridade(t.prioridade));return 0}
  function linhaScore(nome,qtd,impacto,regra,percent){const cls=impacto>=0?'scoreDeltaPlus':'scoreDeltaMinus',sinal=impacto>0?'+':'';return `<tr><td><b>${nome}</b></td><td>${qtd}</td><td class="${cls}">${sinal}${impacto}</td><td><span class="small">${regra}</span></td><td><div class="scoreBar"><div class="scoreBarFill" style="width:${Math.max(0,Math.min(100,percent))}%"></div></div></td></tr>`}

  function inserirScoreNoDashboard(){
    const dashboard=byId('dashboard'); if(!dashboard||byId('scoreCardDashboard'))return;
    const card=document.createElement('div');card.className='card scoreHero moneyGlow';card.id='scoreCardDashboard';
    card.innerHTML=`<div class="scoreContent"><div class="sectionTitle"><h2>💎 Score Geral</h2><button onclick="showTab('score')">Ver detalhes</button></div><div class="scoreRingWrap"><div class="scoreRing" id="dashScoreRing" style="--scoreDeg:0%"><div class="scoreRingInner" id="dashScoreRingText">0</div></div><div><div class="scoreNumber" id="dashScoreNumero">0</div><div class="scoreLabel" id="dashScoreNivel">Calculando...</div><p id="dashScoreResumo" style="max-width:680px;margin:8px 0 0;opacity:.9"></p></div></div></div>`;
    dashboard.insertBefore(card,dashboard.firstChild);
  }

  function garantirPaginaScore(){
    const app=document.querySelector('.app'); if(!app)return false;
    const tabs=document.querySelector('.tabs');
    if(tabs&&!byId('tabScore')){const b=document.createElement('button');b.id='tabScore';b.className='tab';b.textContent='💎 Score';b.onclick=function(){showTab('score',this)};const configTab=[...tabs.children].find(x=>x.textContent.includes('⚙️'));tabs.insertBefore(b,configTab||null)}
    if(!byId('score')){const config=byId('config');const sec=document.createElement('section');sec.id='score';sec.className='page hidden';sec.innerHTML=`<div class="card scoreHero moneyGlow"><div class="scoreContent"><div class="sectionTitle"><h2>💎 Score Geral de Produtividade</h2><span class="small" style="color:white">0 a 100</span></div><div class="scoreRingWrap"><div class="scoreRing" id="scoreRing" style="--scoreDeg:0%"><div class="scoreRingInner" id="scoreRingText">0</div></div><div><div class="scoreNumber" id="scoreNumero">0</div><div class="scoreLabel" id="scoreNivel">Calculando...</div><p id="scoreResumo" style="max-width:680px;margin:8px 0 0;opacity:.9"></p></div></div></div></div><div class="scoreGrid"><div class="scoreMini"><strong id="scorePrazo">0</strong><span class="small">Concluídas no prazo</span></div><div class="scoreMini"><strong id="scoreAtrasos">0</strong><span class="small">Tarefas atrasadas</span></div><div class="scoreMini"><strong id="scoreCriticas">0</strong><span class="small">Críticas abertas</span></div><div class="scoreMini"><strong id="scoreGanho">0</strong><span class="small">Pontos líquidos</span></div></div><div class="card"><div class="sectionTitle"><h2>Composição da pontuação</h2><span class="small">Ganhos e perdas</span></div><div class="tableWrap"><table class="scoreTable"><thead><tr><th>Item</th><th>Qtd</th><th>Impacto</th><th>Regra</th><th>Barra</th></tr></thead><tbody id="scoreTabela"></tbody></table></div></div><div class="card"><div class="sectionTitle"><h2>Ranking de impacto das tarefas</h2><span class="small">O que mais derruba ou aumenta seu score</span></div><div class="tableWrap"><table class="scoreTable"><thead><tr><th>Tarefa</th><th>Data</th><th>Prioridade</th><th>Status</th><th>Impacto</th></tr></thead><tbody id="scoreTarefas"></tbody></table></div></div>`;app.insertBefore(sec,config||null)}
    inserirScoreNoDashboard();return true;
  }

  function atualizarElementosScore(prefix,s){const num=byId(prefix+'ScoreNumero'),ring=byId(prefix+'ScoreRing'),ringText=byId(prefix+'ScoreRingText'),nivel=byId(prefix+'ScoreNivel'),resumo=byId(prefix+'ScoreResumo');if(num)num.textContent=s.score;if(ring)ring.style.setProperty('--scoreDeg',s.score+'%');if(ringText)ringText.textContent=s.score;if(nivel)nivel.textContent=nivelScore(s.score);if(resumo)resumo.textContent='Atrasos e críticas reduzem pontos. Concluir no prazo recupera. Pagamentos pendentes também pesam.'}

  function renderScore(){
    if(!garantirPaginaScore())return; const s=calcularScoreGeral(); atualizarElementosScore('',s); atualizarElementosScore('dash',s);
    const set=(id,val)=>{const el=byId(id);if(el)el.textContent=val};set('scorePrazo',s.concluidasNoPrazo.length);set('scoreAtrasos',s.atrasadas.length);set('scoreCriticas',s.criticas.length);set('scoreGanho',(s.liquidoHoje>0?'+':'')+s.liquidoHoje);
    const tabela=byId('scoreTabela');if(tabela)tabela.innerHTML=[linhaScore('Concluídas no prazo',s.concluidasNoPrazo.length,s.ganhoPrazo,'Ganha pontos por entrega dentro do prazo',s.ganhoPrazo*5),linhaScore('Atrasadas',s.atrasadas.length,-s.perdaAtrasos,'Perde pontos por dias de atraso e prioridade',s.perdaAtrasos*2),linhaScore('Críticas abertas',s.criticas.length,-s.perdaCriticas,'Cada crítica aberta pesa bastante',s.perdaCriticas*5),linhaScore('Vencem hoje',s.vencemHoje.length,-s.perdaHoje,'Tarefas do dia pedem atenção',s.perdaHoje*8),linhaScore('Pagamentos pendentes',s.pagamentos.length,-s.perdaPagamentos,'Pendências financeiras reduzem estabilidade',s.perdaPagamentos*8),linhaScore('Concluídas fora do prazo',s.concluidasAtrasadas.length,-s.perdaConcluidasAtrasadas,'Concluir atrasado ajuda, mas deixa penalidade leve',s.perdaConcluidasAtrasadas*8)].join('');
    const tarefas=byId('scoreTarefas');if(tarefas){const lista=[...(safeState().tarefas||[])].map(t=>({t,impacto:impactoTarefa(t)})).sort((a,b)=>a.impacto-b.impacto).slice(0,18);tarefas.innerHTML=lista.map(({t,impacto})=>{const cls=impacto>=0?'scoreDeltaPlus':'scoreDeltaMinus',sinal=impacto>0?'+':'';return `<tr><td><b>${escapeTxt(t.nome)}</b><br><span class="small">${escapeTxt(t.categoria||'')}</span></td><td>${dbr(t.data)}${t.hora?'<br><span class="small">'+t.hora+'</span>':''}</td><td>${priorityIcon(t.prioridade)}</td><td>${taskStatus(t)}</td><td class="${cls}">${sinal}${impacto}</td></tr>`}).join('')||'<tr><td colspan="5">Nenhuma tarefa cadastrada.</td></tr>'}
    try{localStorage.setItem('score_geral_atual',String(s.score))}catch(e){} atualizarScoreNaNotificacao(s);
  }
  function atualizarScoreNaNotificacao(s){try{s=s||calcularScoreGeral();if(window.AndroidApp&&AndroidApp.updateStatusNotification){const atual=typeof gerarStatusNotificacao==='function'?gerarStatusNotificacao():{summary:'',detail:''};AndroidApp.updateStatusNotification(`Score ${s.score}/100 • ${atual.summary}`,`💎 Score geral: ${s.score}/100\n${nivelScore(s.score)}\n━━━━━━━━━━━━━━━━━━━━\n${atual.detail}`)}}catch(e){}}
  function instalar(){const tenta=()=>{garantirPaginaScore();renderScore()};if(typeof window.render==='function'&&!window.__scoreWrapped){const original=window.render;window.render=function(){original();setTimeout(renderScore,0)};window.__scoreWrapped=true}tenta();setTimeout(tenta,300);setTimeout(tenta,1000);setInterval(renderScore,30000)}
  window.calcularScoreGeral=calcularScoreGeral;window.renderScore=renderScore;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar);else instalar();
})();

// Meu Dia Pro v2.7 - Melhorias em 1 commit: missões, histórico e sugestões inteligentes
(function(){
  if(window.__meuDiaPro27) return;
  window.__meuDiaPro27=true;

  function cssV27(){
    if(document.getElementById('style-v27')) return;
    const style=document.createElement('style');
    style.id='style-v27';
    style.textContent=`
      .v27Grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
      .v27Card{background:rgba(255,255,255,.94);border:1px solid var(--line);border-radius:24px;padding:14px;box-shadow:var(--shadow)}
      .v27Card b{font-size:16px}
      .v27Hint{padding:12px;border-radius:18px;background:linear-gradient(135deg,#eef5ff,#fff);border:1px solid #dbe5f3;margin-bottom:8px}
      .v27Chart{height:120px;display:flex;align-items:end;gap:6px;padding:10px;border-radius:20px;background:#f8fbff;border:1px solid #dbe5f3}
      .v27Bar{flex:1;border-radius:999px 999px 4px 4px;background:linear-gradient(180deg,#1769ff,#22c55e);min-height:6px}
      .v27Mission{display:flex;gap:10px;align-items:center;background:#fff;border:1px solid #dbe5f3;border-radius:18px;padding:11px;margin-bottom:8px;box-shadow:0 6px 16px rgba(15,23,42,.06)}
      .v27MissionIcon{font-size:24px}.v27Badge{display:inline-flex;padding:4px 8px;border-radius:999px;background:#eef5ff;color:#174ea6;font-weight:900;font-size:12px}
      .themeDark .v27Card,.themeDark .v27Mission,.themeDark .v27Hint,.themeDark .v27Chart{background:#111827!important;border-color:#1e293b!important}
      @media(max-width:850px){.v27Grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function st(){return window.state||{tarefas:[]}}
  function hoje(){return typeof hojeStr==='function'?hojeStr():new Date().toISOString().slice(0,10)}
  function esc2(s){return typeof esc==='function'?esc(s):String(s??'')}
  function scoreAtual(){try{return window.calcularScoreGeral?window.calcularScoreGeral():{score:Number(localStorage.getItem('score_geral_atual')||0),atrasadas:[],criticas:[],vencemHoje:[],pagamentos:[],concluidasNoPrazo:[]}}catch(e){return {score:0,atrasadas:[],criticas:[],vencemHoje:[],pagamentos:[],concluidasNoPrazo:[]}}}

  function salvarHistoricoScore(){try{const s=scoreAtual().score,key='score_history_v27',arr=JSON.parse(localStorage.getItem(key)||'[]'),d=hoje(),last=arr[arr.length-1];if(!last||last.date!==d)arr.push({date:d,score:s});else last.score=s;localStorage.setItem(key,JSON.stringify(arr.slice(-14)))}catch(e){}}

  function missoesDoDia(){
    const s=scoreAtual(), tarefas=st().tarefas||[], abertas=tarefas.filter(t=>!t.done), atraso=s.atrasadas?.[0], critica=s.criticas?.[0], hojeTask=s.vencemHoje?.[0], pagamento=s.pagamentos?.[0];
    const mis=[];
    if(atraso)mis.push(['🚨','Eliminar atraso principal',`Concluir: ${atraso.nome}`,'Alta']);
    if(critica)mis.push(['⚫','Resolver tarefa crítica',`Prioridade máxima: ${critica.nome}`,'Crítica']);
    if(hojeTask)mis.push(['📅','Fechar tarefa de hoje',`Entrega: ${hojeTask.nome}`,'Hoje']);
    if(pagamento)mis.push(['💰','Regularizar pagamento',`Pendente: ${pagamento.nome}`,'Financeiro']);
    if(!mis.length&&abertas[0])mis.push(['🎯','Avançar no dia',`Faça primeiro: ${abertas[0].nome}`,'Foco']);
    if(!mis.length)mis.push(['✅','Dia limpo','Nenhuma missão urgente agora.','Livre']);
    return mis.slice(0,4);
  }

  function sugestoesInteligentes(){
    const s=scoreAtual(), out=[];
    if(s.score<60)out.push('Seu score está baixo: conclua uma tarefa atrasada antes de adicionar novas tarefas.');
    if((s.atrasadas||[]).length>2)out.push('Você tem várias atrasadas: use “Adiar atrasadas” só nas que realmente podem esperar.');
    if((s.criticas||[]).length>0)out.push('Tarefas críticas abertas derrubam bastante o score. Resolva uma crítica para recuperar pontos rápido.');
    if((s.pagamentos||[]).length>0)out.push('Pagamentos pendentes reduzem estabilidade. Marque como pago ou revise a data de vencimento.');
    if((s.vencemHoje||[]).length>3)out.push('Hoje está carregado. Escolha 3 tarefas principais e mova o restante para amanhã.');
    if(!out.length)out.push('Sua organização está boa. Mantenha o ritmo e conclua as tarefas no prazo para subir o score.');
    return out;
  }

  function renderV27(){
    cssV27();salvarHistoricoScore();
    const dashboard=document.getElementById('dashboard');if(!dashboard)return;
    let painel=document.getElementById('painelV27');
    if(!painel){painel=document.createElement('div');painel.id='painelV27';painel.className='card';painel.innerHTML=`<div class="sectionTitle"><h2>🧠 Assistente do Dia</h2><span class="small">missões, histórico e próximas ações</span></div><div class="v27Grid"><div class="v27Card"><b>🏆 Missões do dia</b><div id="v27Missoes" style="margin-top:10px"></div></div><div class="v27Card"><b>📈 Histórico do Score</b><div id="v27Chart" class="v27Chart" style="margin-top:10px"></div></div><div class="v27Card"><b>💡 Sugestões inteligentes</b><div id="v27Sugestoes" style="margin-top:10px"></div></div></div>`;const after=document.getElementById('scoreCardDashboard')||dashboard.firstChild;if(after&&after.nextSibling)dashboard.insertBefore(painel,after.nextSibling);else dashboard.insertBefore(painel,dashboard.firstChild)}
    const mis=document.getElementById('v27Missoes');if(mis)mis.innerHTML=missoesDoDia().map(m=>`<div class="v27Mission"><div class="v27MissionIcon">${m[0]}</div><div style="flex:1"><b>${m[1]}</b><br><span class="small">${esc2(m[2])}</span></div><span class="v27Badge">${m[3]}</span></div>`).join('');
    const chart=document.getElementById('v27Chart');if(chart){let hist=[];try{hist=JSON.parse(localStorage.getItem('score_history_v27')||'[]')}catch(e){}if(!hist.length)hist=[{date:hoje(),score:scoreAtual().score}];chart.innerHTML=hist.map(h=>`<div class="v27Bar" title="${h.date}: ${h.score}" style="height:${Math.max(6,h.score)}%"></div>`).join('')}
    const sug=document.getElementById('v27Sugestoes');if(sug)sug.innerHTML=sugestoesInteligentes().map(x=>`<div class="v27Hint">${esc2(x)}</div>`).join('');
  }

  function instalarV27(){if(typeof window.render==='function'&&!window.__v27Wrapped){const original=window.render;window.render=function(){original();setTimeout(renderV27,0)};window.__v27Wrapped=true}renderV27();setTimeout(renderV27,500);setTimeout(renderV27,1500);setInterval(renderV27,45000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalarV27);else instalarV27();
})();
