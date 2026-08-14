const SUPABASE_URL = 'https://dxsrpceiovhboavzucwf.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'sb_publishable_pWlL4ya-8WaPCmeG-Osr6g_qiZfHq1Z';

let supabaseClient;
let state = {members:[], alerts:[]};
let user = null, popupAlert = null, audioContext = null;

async function loadSupabase(){
  if(window.supabase?.createClient){
    supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
    return;
  }
  await new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.onload=resolve;
    s.onerror=reject;
    document.head.appendChild(s);
  });
  supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
}

const normalise=()=>{
  state.members.forEach(m=>{
    m.id=m.id||m.user_id;
    m.username=m.username||m.email?.split('@')[0]||'';
    m.initials=m.initials||m.display_name?.split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase()||'??';
    m.color=m.color||'#d6e5a2';
  });
  state.alerts.forEach(a=>{
    a.recipients ||= [];
    a.responses ||= {};
  });
};

const avatar=m=>`<span class="member-avatar" style="background:${m.color}">${m.initials}</span>`;
const isAdmin=()=>user?.role==='admin';

async function refreshState(){
  const {data:{user:authUser},error:authError}=await supabaseClient.auth.getUser();
  if(authError) throw authError;
  if(!authUser){ state={members:[],alerts:[]}; user=null; return; }

  const {data:profiles,error:profileError}=await supabaseClient.from('profiles')
    .select('id,display_name,username,role,color,created_at').order('created_at');
  if(profileError) throw profileError;

  const {data:alerts,error:alertsError}=await supabaseClient.from('alerts')
    .select('id,title,message,created_by,created_at,alert_recipients(member_id,response,responded_at)')
    .order('created_at',{ascending:false});
  if(alertsError) throw alertsError;

  state.members=(profiles||[]).map(p=>({
    id:p.id,name:p.display_name,username:p.username,role:p.role==='admin'?'Administrator':'Member',
    initials:p.display_name.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase(),
    color:p.color||'#d6e5a2'
  }));

  state.alerts=(alerts||[]).map(a=>({
    id:a.id,title:a.title,message:a.message,created_by:a.created_by,
    recipients:(a.alert_recipients||[]).map(r=>r.member_id),
    responses:Object.fromEntries((a.alert_recipients||[]).filter(r=>r.response).map(r=>[
      r.member_id,{decision:r.response,at:new Date(r.responded_at).toLocaleString()}
    ])),
    sentAt:new Date(a.created_at).toLocaleString()
  }));

  const me=state.members.find(m=>m.id===authUser.id);
  user=me?{...me,email:authUser.email}:null;
  normalise();
}

async function updateProfile(id,patch){
  const {error}=await supabaseClient.from('profiles').update(patch).eq('id',id);
  if(error) throw error;
  await refreshState();
}

async function createMember(){
  // Supabase Auth users should be created in Authentication > Users (or via a trusted
  // server/Edge Function). The browser must never receive a service-role key.
  alert('Create the user in Supabase Dashboard > Authentication > Users first, then edit their profile here.');
}

function prepareBuzz(){if(!audioContext){const AC=window.AudioContext||window.webkitAudioContext;if(AC)audioContext=new AC()}audioContext?.resume?.()}
function buzz(){try{prepareBuzz();if(!audioContext)return;const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.frequency.setValueAtTime(740,audioContext.currentTime);osc.frequency.setValueAtTime(980,audioContext.currentTime+.09);gain.gain.setValueAtTime(.07,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.26);osc.connect(gain).connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+.27);navigator.vibrate?.([120,70,120])}catch{}};
const avatar=m=>`<span class="member-avatar" style="background:${m.color}">${m.initials}</span>`;const isAdmin=()=>user?.username==='admin';
function prepareBuzz(){if(!audioContext){const AC=window.AudioContext||window.webkitAudioContext;if(AC)audioContext=new AC()}audioContext?.resume?.()}
function buzz(){try{prepareBuzz();if(!audioContext)return;const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.frequency.setValueAtTime(740,audioContext.currentTime);osc.frequency.setValueAtTime(980,audioContext.currentTime+.09);gain.gain.setValueAtTime(.07,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.26);osc.connect(gain).connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+.27);navigator.vibrate?.([120,70,120])}catch{}};
function show(id){$('#modal-backdrop').hidden=false;$('#'+id).hidden=false}function close(id){$('#modal-backdrop').hidden=true;$('#'+id).hidden=true}
function memberRows(){const term=$('#search').value.toLowerCase(),members=state.members.slice(1).filter(m=>m.name.toLowerCase().includes(term));$('#member-list').innerHTML=members.map(m=>`<label class="member"><input class="check" data-user="${m.id}" type="checkbox" ${m.selected?'checked':''}/>${avatar(m)}<span class="member-info"><strong>${m.name}</strong><small>@${m.username}</small></span><span class="presence"></span></label>`).join('');const chosen=state.members.slice(1).filter(m=>m.selected);$('#selected-count').textContent=`${chosen.length} selected`;$('#recipient-label').textContent=`${chosen.length} recipient${chosen.length===1?'':'s'}`;$('#recipient-stack').innerHTML=chosen.slice(0,4).map(avatar).join('');$('#select-all').textContent=chosen.length===state.members.length-1?'Deselect all':'Select all'}
function renderResponses(){const rows=state.alerts.slice().reverse().flatMap(a=>a.recipients.map(id=>({alert:a,member:state.members.find(m=>m.id===id),response:a.responses?.[id]})));$('#response-list').innerHTML=rows.length?rows.map(({alert,member,response})=>`<div class="response-row"><span><strong>${member?.name||'Removed member'}</strong><small> · ${alert.title}</small></span><span class="decision ${response?.decision||''}">${response?`${response.decision} · ${response.at}`:'Awaiting response'}</span></div>`).join(''):`<div class="empty">No alerts have been sent yet.</div>`}
function renderInbox(){const alerts=state.alerts.filter(a=>a.recipients.includes(user.id)).reverse();$('#inbox-list').innerHTML=alerts.length?alerts.map(a=>{const response=a.responses?.[user.id];return `<article class="inbox-card"><h2>${a.title}</h2><p>${a.message}</p><small>${a.sentAt}</small>${response?`<div class="response-done">You ${response.decision} this alert.</div>`:`<div class="response-actions"><button class="respond confirm" data-response="confirmed" data-alert="${a.id}">Confirm</button><button class="respond decline" data-response="declined" data-alert="${a.id}">Decline</button></div>`}</article>`}).join(''):`<div class="empty">No alerts yet. When your administrator sends you an update, it will appear here.</div>`}
function profile(){$('#signed-name').textContent=isAdmin()?'Administrator':user.name;$('#signed-role').textContent=isAdmin()?'Owner account':user.role;$('#profile-avatar').textContent=user.initials;$('.admin-view').hidden=!isAdmin();$('#member-view').hidden=isAdmin();$('#send-footer').hidden=!isAdmin();document.querySelectorAll('.admin-only').forEach(el=>el.hidden=!isAdmin());if(!isAdmin()){$('#page-label').textContent='My alerts';$('#compose-link').hidden=true;$('#inbox-link').classList.add('active');renderInbox()}else{$('#page-label').textContent='New alert';$('#compose-link').hidden=false;$('#inbox-link').classList.remove('active');memberRows();renderResponses()}}
function renderManage(){$('#manage-list').innerHTML=state.members.filter(m=>!isAdmin()||m.id!==user.id).map(m=>`<div class="manage-row"><input data-name="${m.id}" value="${m.name}" aria-label="Member name"><input data-username="${m.id}" value="${m.username}" aria-label="Username"><button class="delete" data-delete="${m.id}">Remove</button></div>`).join('')}
function openMemberAlert(alert,withBuzz=false){if(!alert||alert.responses?.[user.id])return;popupAlert=alert;$('#alert-title').textContent=alert.title;$('#alert-message').textContent=alert.message;if(withBuzz)buzz();show('alert-modal')}
async function completeLogin(found){
  user=found;
  prepareBuzz();
  $('#login-screen').hidden=true;
  $('#app-shell').hidden=false;
  profile();
  if(!isAdmin()){
    const received=state.alerts.filter(a=>a.recipients.includes(user.id)&&!a.responses?.[user.id]);
    openMemberAlert(received[0]);
  }
}

async function signIn(e){
  e.preventDefault();
  const username=$('#login-username').value.trim().toLowerCase();
  const password=$('#login-password').value;
  const email=username.includes('@')?username:`${username}@alertdesk.local`;
  const {error}=await supabaseClient.auth.signInWithPassword({email,password});
  if(error){$('#login-error').textContent='That username or password is not correct.';return}
  await refreshState();
  if(!user){$('#login-error').textContent='Your account exists but has no Alert Desk profile.';return}
  await completeLogin(user);
}

$('#sign-in-form').addEventListener('submit',signIn);

$('#logout').addEventListener('click',async()=>{
  await supabaseClient.auth.signOut();
  user=null;popupAlert=null;
  $('#app-shell').hidden=true;$('#login-screen').hidden=false;
  $('#sign-in-form').reset();$('#login-error').textContent=''
});

$('#members-link').addEventListener('click',e=>{
  e.preventDefault();renderManage();show('members-modal')
});

$('#modal-backdrop').addEventListener('click',()=>document.querySelectorAll('.modal:not([hidden])').forEach(m=>close(m.id)));

document.addEventListener('click',async e=>{
  if(e.target.dataset.close)close(e.target.dataset.close);

  if(e.target.dataset.delete){
    const id=e.target.dataset.delete;
    if(confirm('Remove this member from Alert Desk?')){
      const {error}=await supabaseClient.from('profiles').delete().eq('id',id);
      if(error){alert(error.message);return}
      await refreshState();renderManage();memberRows();
    }
  }

  if(e.target.dataset.response){
    const alert=state.alerts.find(a=>a.id===e.target.dataset.alert);
    await recordResponse(e.target.dataset.response,alert);
  }
});

$('#manage-list').addEventListener('input',async e=>{
  const id=e.target.dataset.name||e.target.dataset.username;
  if(!id)return;
  const patch={};
  const member=state.members.find(m=>m.id===id);
  if(!member)return;

  if(e.target.dataset.name){
    patch.display_name=e.target.value;
  }
  if(e.target.dataset.username){
    patch.username=e.target.value.trim().toLowerCase();
  }

  try{
    await updateProfile(id,patch);
    renderManage();memberRows();
  }catch(err){console.error(err)}
});

$('#add-member').addEventListener('click',createMember);

$('#member-list').addEventListener('change',e=>{
  if(e.target.dataset.user){
    const member=state.members.find(m=>m.id===e.target.dataset.user);
    if(member)member.selected=e.target.checked;
    memberRows();
  }
});

$('#search').addEventListener('input',memberRows);
$('#select-all').addEventListener('click',()=>{
  const people=state.members.filter(m=>m.id!==user?.id),all=people.every(m=>m.selected);
  people.forEach(m=>m.selected=!all);memberRows()
});
$('#clear').addEventListener('click',()=>{state.members.forEach(m=>m.selected=false);memberRows()});

for(const [id,count] of [['title','count'],['message','message-count']]){
  const el=$('#'+id);
  el.addEventListener('input',()=>$('#'+count).textContent=`${el.value.length} / ${el.maxLength}`)
}

$('#alert-form').addEventListener('submit',async e=>{
  e.preventDefault();
  if(!isAdmin())return;

  const recipients=state.members.filter(m=>m.id!==user.id&&m.selected).map(m=>m.id);
  if(!recipients.length){$('#selected-count').textContent='Choose at least one member';return}

  const {data:alert,error}=await supabaseClient.from('alerts').insert({
    title:$('#title').value,
    message:$('#message').value,
    created_by:user.id
  }).select('id').single();

  if(error){alert(error.message);return}

  const rows=recipients.map(member_id=>({alert_id:alert.id,member_id}));
  const {error:recipientError}=await supabaseClient.from('alert_recipients').insert(rows);
  if(recipientError){alert(recipientError.message);return}

  state.members.forEach(m=>m.selected=false);
  await refreshState();

  $('#toast-copy').textContent=`Sent to ${recipients.length} member${recipients.length===1?'':'s'}.`;
  $('#toast').classList.add('show');
  setTimeout(()=>$('#toast').classList.remove('show'),3500);
  e.target.reset();
  $('#count').textContent='0 / 70';
  $('#message-count').textContent='0 / 500';
  memberRows();renderResponses();
});

async function recordResponse(decision,alert){
  if(!alert||!user)return;
  const {error}=await supabaseClient.from('alert_recipients')
    .update({response:decision,responded_at:new Date().toISOString()})
    .eq('alert_id',alert.id).eq('member_id',user.id).is('response',null);
  if(error){alert(error.message);return}
  await refreshState();
  renderInbox();close('alert-modal');popupAlert=null;
}

$('#modal-confirm').addEventListener('click',()=>recordResponse('confirmed',popupAlert));
$('#modal-decline').addEventListener('click',()=>recordResponse('declined',popupAlert));

async function handleRealtime(){
  const before=state.alerts.map(a=>a.id);
  try{
    await refreshState();
    profile();
    if(!isAdmin()){
      const fresh=state.alerts.find(a=>!before.includes(a.id)&&a.recipients.includes(user.id)&&!a.responses?.[user.id]);
      if(fresh)openMemberAlert(fresh,true);
    }
  }catch(err){console.error('Realtime refresh failed:',err)}
}

async function init(){
  try{
    await loadSupabase();

    supabaseClient.auth.onAuthStateChange(async(event,session)=>{
      if(event==='SIGNED_OUT'){
        user=null;
        $('#app-shell').hidden=true;
        $('#login-screen').hidden=false;
        return;
      }
      if(session){
        setTimeout(async()=>{
          try{
            await refreshState();
            if(user)await completeLogin(user);
          }catch(err){console.error(err)}
        },0);
      }
    });

    supabaseClient.channel('alert-desk-live')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'alerts'},handleRealtime)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'alert_recipients'},handleRealtime)
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'alert_recipients'},handleRealtime)
      .subscribe();

    const {data:{session}}=await supabaseClient.auth.getSession();
    if(session){
      await refreshState();
      if(user)await completeLogin(user);
    }
  }catch(err){
    console.error(err);
    $('#login-error').textContent='Alert Desk could not connect to Supabase. Check your URL and anon/publishable key.';
  }
}

document.addEventListener('pointerdown',prepareBuzz,{once:true});
init();
