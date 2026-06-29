// Meu Dia Pro v2.4 - Score Geral 0 a 100
function garantirPaginaScore(){
  if(document.getElementById('score')) return;
  const tabs=document.querySelector('.tabs');
  if(tabs && !document.getElementById('tabScore')){
    const b=document.createElement('button');
    b.id='tabScore';
    b.className='tab';
    b.textContent='💎 Score';
    b.onclick=function(){showTab('score',this)};
    const configTab=[...tabs.children].find(x=>x.textContent.includes('⚙️'));
    tabs.insertBefore(b,configTab||null);
  }
  const app=document.querySelector('.app');
  const config=document.getElementById('config');
  const sec=document.createElement('section');
  sec.id='score';
  sec.className='page hidden';
  sec.innerHTML=`
    <div class="card scoreHero moneyGlow"><div class="scoreContent"><div class="sectionTitle"><h2>Score Geral de Produtividade</h2><span class="small" style="color:white">0 a 100</span></div><div class="scoreRingWrap"><div class="scoreRing" id="scoreRing" style="--scoreDeg:0%"><div class="scoreRingInner" id="scoreRingText">0</div></div><div><div class="scoreNumber" id="scoreNumero">0</div><div class="scoreLabel" id="scoreNivel">Calculando...</div><p id="scoreResumo" style="max-width:680px;margin:8px 0 0;opacity:.9"></p></div></div></div></div>
    <div class="scoreGrid"><div class="scoreMini"><strong id="scorePrazo">0</strong><span class="small">Concluídas no prazo</span></div><div class="scoreMini"><strong id="scoreAtrasos">0</strong><span class="small">Tarefas atrasadas</span></div><div class="scoreMini"><strong id="scoreCriticas">0</strong><span class="small">Críticas abertas</span></div><div class="scoreMini"><strong id="scoreGanho">0</strong><span class="small">Pontos líquidos hoje</span></div></div>
    <div class="card"><div class="sectionTitle"><h2>Composição da pontuação</h2><span class="small">Ganhos e perdas</span></div><div class="tableWrap"><table class="scoreTable"><thead><tr><th>Item</th><th>Qtd</th><th>Impacto</th><th>Regra</th><th>Barra</th></tr></thead><tbody id="scoreTabela"></tbody></table></div></div>
    <div class="card"><div class="sectionTitle"><h2>Ranking de impacto das tarefas</h2><span class="small">O que mais derruba ou aumenta seu score</span></div><div class="tableWrap"><table class="scoreTable"><thead><tr><th>Tarefa</th><th>Data</th><th>Prioridade</th><th>Status</th><th>Impacto</th></tr></thead><tbody id="scoreTarefas"></tbody></table></div></div>`;
  app.insertBefore(sec,config||null);
}
function scorePesoPrioridade(p){return {'Crítica':4,'Alta':3,'Média':2,'Baixa':1,'Opcional':0.5}[p]||2}
function calcularScoreGeral(){
  const tarefas=state.tarefas||[],abertas=tarefas.filter(t=>!t.done),concluidas=tarefas.filter(t=>t.done),hoje=hojeStr();
  const atrasadas=abertas.filter(t=>t.data&&diasEntre(t.data,hoje)<0),vencemHoje=abertas.filter(t=>t.data===hoje),criticas=abertas.filter(t=>t.prioridade==='Crítica'),pagamentos=abertas.filter(t=>t.pagamento==='nao');
  const concluidasNoPrazo=concluidas.filter(t=>!t.data||!t.completedAt||String(t.completedAt).slice(0,10)<=t.data);
  const concluidasAtrasadas=concluidas.filter(t=>t.data&&t.completedAt&&String(t.completedAt).slice(0,10)>t.data);
  let perdaAtrasos=0,perdaCriticas=0,perdaHoje=0,perdaPagamentos=0,ganhoPrazo=0,perdaConcluidasAtrasadas=0;
  atrasadas.forEach(t=>{const dias=Math.abs(diasEntre(t.data,hoje));perdaAtrasos+=Math.min(30,dias*scorePesoPrioridade(t.prioridade)*1.8)});
  criticas.forEach(t=>perdaCriticas+=4);vencemHoje.forEach(t=>perdaHoje+=scorePesoPrioridade(t.prioridade)*0.8);pagamentos.forEach(t=>perdaPagamentos+=Math.min(8,2+(Number(t.valor||0)>0?2:0)));
  concluidasNoPrazo.forEach(t=>ganhoPrazo+=scorePesoPrioridade(t.prioridade)*1.2);concluidasAtrasadas.forEach(t=>perdaConcluidasAtrasadas+=scorePesoPrioridade(t.prioridade)*0.8);
  let score=100-perdaAtrasos-perdaCriticas-perdaHoje-perdaPagamentos-perdaConcluidasAtrasadas+Math.min(18,ganhoPrazo);score=Math.max(0,Math.min(100,Math.round(score)));
  return {score,abertas,concluidas,atrasadas,vencemHoje,criticas,pagamentos,concluidasNoPrazo,concluidasAtrasadas,perdaAtrasos:Math.round(perdaAtrasos),perdaCriticas:Math.round(perdaCriticas),perdaHoje:Math.round(perdaHoje),perdaPagamentos:Math.round(perdaPagamentos),ganhoPrazo:Math.round(Math.min(18,ganhoPrazo)),perdaConcluidasAtrasadas:Math.round(perdaConcluidasAtrasadas),liquidoHoje:Math.round(Math.min(18,ganhoPrazo)-perdaHoje-perdaAtrasos)};
}
function nivelScore(s){if(s>=90)return 'Excelente — rotina sob controle';if(s>=75)return 'Muito bom — poucas pendências pesadas';if(s>=60)return 'Atenção — atrasos já estão pesando';if(s>=40)return 'Risco alto — priorize atrasadas e críticas';return 'Crítico — foco total nas tarefas vencidas'}
function linhaScore(nome,qtd,impacto,regra,percent){const cls=impacto>=0?'scoreDeltaPlus':'scoreDeltaMinus',sinal=impacto>0?'+':'';return `<tr><td><b>${nome}</b></td><td>${qtd}</td><td class="${cls}">${sinal}${impacto}</td><td><span class="small">${regra}</span></td><td><div class="scoreBar"><div class="scoreBarFill" style="width:${Math.max(0,Math.min(100,percent))}%"></div></div></td></tr>`}
function impactoTarefa(t){if(t.done){if(t.data&&t.completedAt&&String(t.completedAt).slice(0,10)>t.data)return -Math.round(scorePesoPrioridade(t.prioridade));return Math.round(scorePesoPrioridade(t.prioridade)*2)}if(t.data&&diasEntre(t.data,hojeStr())<0){const dias=Math.abs(diasEntre(t.data,hojeStr()));return -Math.round(Math.min(30,dias*scorePesoPrioridade(t.prioridade)*1.8))}if(t.prioridade==='Crítica')return -4;if(t.data===hojeStr())return -Math.round(scorePesoPrioridade(t.prioridade));return 0}
function renderScore(){garantirPaginaScore();const s=calcularScoreGeral();scoreNumero.textContent=s.score;scoreRingText.textContent=s.score;scoreRing.style.setProperty('--scoreDeg',s.score+'%');scoreNivel.textContent=nivelScore(s.score);scoreResumo.textContent='Seu score começa em 100. Atrasos, tarefas críticas abertas, pagamentos pendentes e tarefas que vencem hoje reduzem pontos. Concluir no prazo recupera pontos.';scorePrazo.textContent=s.concluidasNoPrazo.length;scoreAtrasos.textContent=s.atrasadas.length;scoreCriticas.textContent=s.criticas.length;scoreGanho.textContent=(s.liquidoHoje>0?'+':'')+s.liquidoHoje;scoreTabela.innerHTML=[linhaScore('Concluídas no prazo',s.concluidasNoPrazo.length,s.ganhoPrazo,'Ganha pontos por entrega dentro do prazo',s.ganhoPrazo*5),linhaScore('Atrasadas',s.atrasadas.length,-s.perdaAtrasos,'Perde mais pontos conforme os dias de atraso e prioridade',s.perdaAtrasos*2),linhaScore('Críticas abertas',s.criticas.length,-s.perdaCriticas,'Cada crítica aberta pesa contra o score',s.perdaCriticas*5),linhaScore('Vencem hoje',s.vencemHoje.length,-s.perdaHoje,'Tarefas do dia exigem atenção',s.perdaHoje*8),linhaScore('Pagamentos pendentes',s.pagamentos.length,-s.perdaPagamentos,'Pendências financeiras reduzem estabilidade',s.perdaPagamentos*8),linhaScore('Concluídas fora do prazo',s.concluidasAtrasadas.length,-s.perdaConcluidasAtrasadas,'Concluir atrasado ajuda, mas deixa penalidade leve',s.perdaConcluidasAtrasadas*8)].join('');const lista=[...(state.tarefas||[])].map(t=>({t,impacto:impactoTarefa(t)})).sort((a,b)=>a.impacto-b.impacto).slice(0,18);scoreTarefas.innerHTML=lista.map(({t,impacto})=>{const cls=impacto>=0?'scoreDeltaPlus':'scoreDeltaMinus',sinal=impacto>0?'+':'';return `<tr><td><b>${esc(t.nome)}</b><br><span class="small">${esc(t.categoria||'')}</span></td><td>${dataBR(t.data)}${t.hora?'<br><span class="small">'+t.hora+'</span>':''}</td><td>${prIcon(t.prioridade)}</td><td>${status(t).txt}</td><td class="${cls}">${sinal}${impacto}</td></tr>`}).join('')||'<tr><td colspan="5">Nenhuma tarefa cadastrada.</td></tr>';try{localStorage.setItem('score_geral_atual',String(s.score))}catch(e){}}
function atualizarScoreNaNotificacao(){try{const s=calcularScoreGeral();if(window.AndroidApp&&AndroidApp.updateStatusNotification){const atual=typeof gerarStatusNotificacao==='function'?gerarStatusNotificacao():{summary:'',detail:''};AndroidApp.updateStatusNotification(`Score ${s.score}/100 • ${atual.summary}`,`💎 Score geral: ${s.score}/100\n${nivelScore(s.score)}\n━━━━━━━━━━━━━━━━━━━━\n${atual.detail}`)}}catch(e){}}
if(typeof render==='function'){const renderScoreOriginal=render;render=function(){renderScoreOriginal();renderScore();atualizarScoreNaNotificacao()}}
setTimeout(()=>{renderScore();atualizarScoreNaNotificacao()},900);
