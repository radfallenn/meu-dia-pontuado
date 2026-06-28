function gerarStatusNotificacao(){
  try{
    const abertas=state.tarefas.filter(t=>!t.done);
    const atras=abertas.filter(t=>t.data&&diasEntre(t.data,hojeStr())<0);
    const hoje=abertas.filter(t=>t.data===hojeStr());
    const crit=[...atras,...hoje].filter(t=>t.prioridade==='Crítica');
    const summary=`${atras.length} atrasada(s) • ${hoje.length} para hoje • ${crit.length} crítica(s)`;
    const lista=[...ordenarLista([...atras]).slice(0,5),...ordenarLista([...hoje]).slice(0,5)];
    let detail=`🚨 Atrasadas: ${atras.length}\n📅 Hoje: ${hoje.length}\n⚫ Críticas: ${crit.length}\n━━━━━━━━━━━━━━━━━━━━\n`;
    if(!lista.length){
      detail+='✅ Nenhuma tarefa atrasada ou marcada para hoje.';
    }else{
      lista.forEach((t,i)=>{
        detail+=`${i+1}. ${prIcon(t.prioridade)} | ${t.nome}\n   ${dataBR(t.data)}${t.hora?' às '+t.hora:''} • ${status(t).txt}\n`;
      });
    }
    return {summary,detail};
  }catch(e){
    return {summary:'Abra o app para atualizar tarefas.',detail:'Não foi possível montar o resumo agora.'};
  }
}

function atualizarNotificacaoStatus(){
  try{
    if(window.AndroidApp&&AndroidApp.updateStatusNotification){
      const s=gerarStatusNotificacao();
      AndroidApp.updateStatusNotification(s.summary,s.detail);
    }
  }catch(e){}
}

if(typeof render==='function'){
  const renderOriginal=render;
  render=function(){
    renderOriginal();
    atualizarNotificacaoStatus();
  };
}

setTimeout(atualizarNotificacaoStatus,700);
setInterval(atualizarNotificacaoStatus,60000);
