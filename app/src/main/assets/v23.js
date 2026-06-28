// Meu Dia Pro v2.3 extras
function openFromAndroid(section){
  try{
    if(section==='hoje'){
      showTab('tarefas');
      filtro.value='hoje';
      render();
    }else if(section==='atrasadas'){
      showTab('tarefas');
      filtro.value='atrasadas';
      render();
    }
  }catch(e){}
}

function agendarLembretesIndividuais(){
  try{
    if(!(window.AndroidApp&&AndroidApp.scheduleTaskReminder)) return;
    state.tarefas.filter(t=>!t.done&&t.data&&t.hora).forEach(t=>{
      const detalhe=`${prIcon(t.prioridade)} ${t.nome}\nPrazo: ${dataBR(t.data)} às ${t.hora}\nStatus: ${status(t).txt}\nCategoria: ${t.categoria||'-'}`;
      AndroidApp.scheduleTaskReminder(t.nome, detalhe, t.data, t.hora, String(t.id));
    });
  }catch(e){}
}

function backupAutomaticoLocal(){
  try{
    const hoje=hojeStr();
    const k='ultimo_backup_auto';
    if(localStorage.getItem(k)!==hoje){
      localStorage.setItem('backup_auto_'+hoje, JSON.stringify({state,config,createdAt:new Date().toISOString()}));
      localStorage.setItem(k,hoje);
    }
  }catch(e){}
}

function resumoRevisaoDiaria(){
  try{
    const conclHoje=state.tarefas.filter(t=>t.done&&String(t.completedAt||'').slice(0,10)===hojeStr()).length;
    const abertas=state.tarefas.filter(t=>!t.done).length;
    const atras=state.tarefas.filter(t=>!t.done&&t.data&&diasEntre(t.data,hojeStr())<0).length;
    return `✅ Concluídas hoje: ${conclHoje}\n📌 Abertas: ${abertas}\n🚨 Atrasadas: ${atras}\n🏆 XP total: ${typeof xpTotal==='function'?xpTotal():0}`;
  }catch(e){return 'Revisão indisponível.'}
}

function criarRevisaoDoDia(){
  alert(resumoRevisaoDiaria());
}

if(typeof render==='function'){
  const renderV23=render;
  render=function(){
    renderV23();
    agendarLembretesIndividuais();
    backupAutomaticoLocal();
  };
}

setTimeout(()=>{agendarLembretesIndividuais();backupAutomaticoLocal();},1200);
