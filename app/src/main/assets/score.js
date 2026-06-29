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
