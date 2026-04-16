var EMOJIS=['😀','😎','🤩','😈','🦁','🐯','🦊','🐺','🐻','🐼','🦄','🐲','🔥','⚡','💎','👑','🎯','🎲','🃏','⭐'];
var COLS=['#ef4444','#3b82f6','#22d3ae','#f5c842','#a78bfa','#ec4899','#f97316','#84cc16'];
var DENOMS=[1000,2000,5000,10000,20000,50000];
var DBAL=100000;
var timerInterval=null;
var toastTimer=null;

function mkPlayers(n){var a=[];for(var i=0;i<n;i++)a.push({name:'Người chơi '+(i+1),color:COLS[i%COLS.length],emoji:'',balance:DBAL,initial:DBAL});return a}
function normState(sv){
  if(!sv||!sv.players||sv.players.length<2)return null;
  var s=sv;
  s.modal=null;s.ap=null;s.atab='send';s.aamt=0;s.atgt=[];s.undoTimer=null;
  if(!s.quickDenoms)s.quickDenoms=[1000,2000,5000,10000];
  if(!s.hist)s.hist=[];if(!s.sessions)s.sessions=[];
  if(typeof s.round==='undefined')s.round=1;
  if(typeof s.sortDesc==='undefined')s.sortDesc=false;
  if(typeof s.pot==='undefined')s.pot=0;
  if(typeof s.potEnabled==='undefined')s.potEnabled=false;
  if(!s.timer)s.timer={startMs:0,elapsed:0,running:false};
  if(typeof s.pinnedNote==='undefined')s.pinnedNote='';
  if(typeof s.theme==='undefined')s.theme=(s.dark?'dark':'auto');
  if(typeof s.compact==='undefined')s.compact=false;
  if(typeof s.autoTimerStart==='undefined')s.autoTimerStart=false;
  if(typeof s.showRanks==='undefined')s.showRanks=false;
  if(typeof s.showTimerAlways==='undefined')s.showTimerAlways=false;
  if(typeof s.soundEnabled==='undefined')s.soundEnabled=true;
  if(typeof s.vibrateEnabled==='undefined')s.vibrateEnabled=true;
  if(!s.txTemplates)s.txTemplates=[];
  if(!s.histFilter)s.histFilter=-1;
  if(typeof s.hidePinned==='undefined')s.hidePinned=false;
  for(var i=0;i<s.players.length;i++){
    if(typeof s.players[i].emoji==='undefined')s.players[i].emoji='';
    if(!s.players[i].name)s.players[i].name='Người chơi '+(i+1);
  }
  return s;
}
var S=null;
try{S=normState(JSON.parse(localStorage.getItem('wc_v13')||'null'))}catch(e){}
if(!S){
  try{S=normState(JSON.parse(localStorage.getItem('wc_v12')||'null'))}catch(e){}
}
if(!S)S={phase:'setup',players:mkPlayers(5),hist:[],sessions:[],quickDenoms:[1000,2000,5000,10000],modal:null,ap:null,atab:'send',aamt:0,atgt:[],undoStack:[],undoTimer:null,round:1,sortDesc:false,pot:0,potEnabled:false,timer:{startMs:0,elapsed:0,running:false},pinnedNote:'',theme:'auto',compact:false,autoTimerStart:false,showRanks:false,showTimerAlways:false,soundEnabled:true,vibrateEnabled:true,txTemplates:[],histFilter:-1,hidePinned:false};
applyTheme();
try{window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(){if(S.theme==='auto')applyTheme()})}catch(e){try{window.matchMedia('(prefers-color-scheme: dark)').addListener(function(){if(S.theme==='auto')applyTheme()})}catch(e2){}}

/* ===== UTILS ===== */
function fmt(n){var a=n<0?-n:n;if(a>=1000000)return(n/1000000).toFixed(a%1000000===0?0:1)+'M';if(a>=1000)return(n/1000).toFixed(a%1000===0?0:1)+'k';return''+n}
function ff(n){return n.toLocaleString('vi-VN')+'d'}
function tnow(){return new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
function totBal(){var t=0;for(var i=0;i<S.players.length;i++)t+=S.players[i].balance;return t}
function totInit(){var t=0;for(var i=0;i<S.players.length;i++)t+=S.players[i].initial;return t}
function $(id){return document.getElementById(id)}
function esc(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function vib(p){if(!S.vibrateEnabled)return;try{if(navigator.vibrate)navigator.vibrate(p)}catch(e){}}
function coin(tp){if(!S.soundEnabled)return;try{var A=window.AudioContext||window.webkitAudioContext;if(!A)return;var ctx=new A();var o=ctx.createOscillator();var g=ctx.createGain();o.connect(g);g.connect(ctx.destination);if(tp==='s'){o.frequency.setValueAtTime(600,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(300,ctx.currentTime+.15)}else{o.frequency.setValueAtTime(330,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(660,ctx.currentTime+.15)}g.gain.setValueAtTime(.12,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.18);o.start();o.stop(ctx.currentTime+.2)}catch(e){}}
function avHtml(p,cls,sz){var c=cls||'av';var s=sz?'font-size:'+sz+'px;':'';if(p.emoji)return '<div class="'+c+' em" style="'+s+'">'+p.emoji+'</div>';return '<div class="'+c+'" style="background:'+p.color+';'+s+'">'+esc(p.name.charAt(0).toUpperCase())+'</div>'}
function rankAt(i){var arr=[];for(var k=0;k<S.players.length;k++)arr.push(k);arr.sort(function(a,b){return S.players[b].balance-S.players[a].balance});for(var j=0;j<arr.length;j++){if(arr[j]===i)return j+1}return 99}
function rankLabel(r){if(r===1)return '🥇';if(r===2)return '🥈';if(r===3)return '🥉';return '#'+r}
function cardMode(){var n=S.players.length;if(n>=15)return 'mini';if(S.compact||n>=9)return 'compact';return 'full'}
function fmt2(n){return (n<10?'0':'')+n}
function getElapsed(){var e=S.timer.elapsed;if(S.timer.running)e+=Date.now()-S.timer.startMs;return e}
function fmtTime(ms){var s=Math.floor(ms/1000);var h=Math.floor(s/3600);var m=Math.floor((s%3600)/60);var sec=s%60;if(h>0)return h+':'+fmt2(m)+':'+fmt2(sec);return fmt2(m)+':'+fmt2(sec)}
function startTimer(){S.timer.startMs=Date.now();S.timer.running=true}
function pauseTimer(){if(S.timer.running){S.timer.elapsed+=Date.now()-S.timer.startMs;S.timer.running=false;S.timer.startMs=0}}
function resumeTimer(){S.timer.startMs=Date.now();S.timer.running=true}
function resetTimer(){S.timer={startMs:0,elapsed:0,running:false}}
function toggleTimer(){
  if(S.timer.running)pauseTimer();else resumeTimer();
  saveState();
  var btn=$('timerElBtn');
  if(btn){btn.className='timer-btn '+(S.timer.running?'run':'pause');btn.innerHTML=(S.timer.running?'⏸ ':'▶ ')+'<span id="timerEl">'+fmtTime(getElapsed())+'</span>'}
}
function startTimerTick(){if(timerInterval)clearInterval(timerInterval);timerInterval=setInterval(function(){if(S.phase==='playing'&&S.timer.running)updateTimerDisplay()},1000)}
function updateTimerDisplay(){var el=$('timerEl');if(el)el.textContent=fmtTime(getElapsed())}
function pushToast(msg){clearTimeout(toastTimer);var wr=$('toast-root');if(!wr)return;wr.innerHTML='<div class="toast">'+esc(msg)+'</div>';toastTimer=setTimeout(function(){if(wr)wr.innerHTML=''},3000)}
function applyTheme(){var dark=false;if(S.theme==='dark')dark=true;else if(S.theme==='auto'){try{dark=window.matchMedia('(prefers-color-scheme: dark)').matches}catch(e){dark=false}}if(dark)document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark')}

/* ===== SAVE ===== */
function saveState(){
  try{
    var savedTimer={startMs:S.timer.startMs,elapsed:S.timer.elapsed,running:S.timer.running};
    var o={phase:S.phase,players:S.players,hist:S.hist,sessions:S.sessions,quickDenoms:S.quickDenoms,undoStack:S.undoStack,round:S.round,sortDesc:S.sortDesc,pot:S.pot,potEnabled:S.potEnabled,timer:savedTimer,pinnedNote:S.pinnedNote,theme:S.theme,compact:S.compact,autoTimerStart:S.autoTimerStart,showRanks:S.showRanks,showTimerAlways:S.showTimerAlways,soundEnabled:S.soundEnabled,vibrateEnabled:S.vibrateEnabled,txTemplates:S.txTemplates,histFilter:S.histFilter,hidePinned:S.hidePinned};
    localStorage.setItem('wc_v13',JSON.stringify(o))
  }catch(e){}
}

/* ===== RENDER ===== */
function render(){var a=$('app');if(S.phase==='setup')a.innerHTML=rSetup();else a.innerHTML=rPlay();saveState()}

/* ===== THEME TOGGLE ===== */
function toggleTheme(){if(S.theme==='auto')S.theme='dark';else if(S.theme==='dark')S.theme='light';else S.theme='auto';applyTheme();saveState();render()}

/* ===== SETUP ===== */
function rSetup(){
  var h='<div style="padding:20px 14px;min-height:100vh;display:flex;flex-direction:column">';
  h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">';
  h+='<div><div style="font-size:22px;font-weight:900;letter-spacing:3px;color:var(--gld)">VÍ TRUNG TÂM</div>';
  h+='<div style="font-size:10px;color:var(--dim);margin-top:3px;letter-spacing:2px">v1.3 &mdash; GHI SỔ GIAO DỊCH</div></div>';
  h+='<button onclick="toggleTheme()" class="ib" style="width:36px;height:36px">'+(S.theme==='dark'?'☀':'◐')+'</button></div>';
  h+='<div style="flex:1">';
  h+='<div class="slbl" style="margin-bottom:8px">Số người chơi (2-20)</div>';
  h+='<div class="pc-ctl"><button class="pc-step" onmousedown="pcPressStart(-1)" onmouseup="pcPressEnd()" onmouseleave="pcPressEnd()" ontouchstart="pcPressStart(-1)" ontouchend="pcPressEnd()">-</button><div class="pc-num">'+S.players.length+'</div><button class="pc-step" onmousedown="pcPressStart(1)" onmouseup="pcPressEnd()" onmouseleave="pcPressEnd()" ontouchstart="pcPressStart(1)" ontouchend="pcPressEnd()">+</button></div>';
  h+='<button class="btn-ghost" onclick="resetDefaults()">Đặt tất cả về mặc định</button>';
  h+='<div style="display:flex;gap:5px"><input id="splitInp" class="sbal" style="flex:1;width:auto;text-align:left" type="number" placeholder="Tổng (k)" step="1" min="1"><span class="sdim">k =</span><button class="btn-ghost" style="margin:0;flex-shrink:0;width:auto;padding:8px 10px" onclick="splitTotal()">Chia đều</button></div>';
  h+='<div class="slbl" style="margin-bottom:8px;margin-top:10px">Người chơi</div>';
  h+='<div style="'+(S.players.length>8?'max-height:320px;overflow-y:auto;':'')+'">';
  for(var i=0;i<S.players.length;i++){var p=S.players[i];
    var avContent=p.emoji?p.emoji:esc(p.name.charAt(0).toUpperCase());
    var avClass='sav'+(p.emoji?' em':'');
    h+='<div class="srow" style="'+(S.players.length>8?'height:44px;':'')+'"><div class="'+avClass+'" style="'+(p.emoji?'':'background:'+p.color)+'" onclick="pickAv('+i+')">'+avContent+'</div>';
    h+='<input class="snm" value="'+esc(p.name)+'" oninput="upName('+i+',this.value)" placeholder="Tên người chơi">';
    h+='<input class="sbal" value="'+(p.initial/1000)+'" oninput="upBal('+i+',this.value)" type="number" step="0.5" min="0.5"><span class="sdim">k</span></div>'}
  h+='</div>';
  h+='<div id="pkpnl"></div>';
  h+='<div style="margin-top:14px;border-top:1px solid var(--bd);padding-top:12px">';
  h+='<label style="display:flex;align-items:center;gap:7px;font-size:12px;margin-bottom:8px"><input type="checkbox" '+(S.potEnabled?'checked':'')+' onchange="togglePot(this.checked)"> Bật quỹ chung</label>';
  if(S.potEnabled)h+='<div class="ca"><input type="number" value="'+(S.pot/1000)+'" oninput="upPot(this.value)" min="0" step="0.5"><span>x 1.000d</span></div>';
  h+='<label style="display:flex;align-items:center;gap:7px;font-size:12px;margin-bottom:8px"><input type="checkbox" '+(S.autoTimerStart?'checked':'')+' onchange="S.autoTimerStart=this.checked"> Bắt đầu đếm giờ ngay khi bắt đầu trận</label>';
  h+='<div class="slbl" style="margin-bottom:6px">Mức tiền nhanh (4 nút)</div>';
  h+='<div class="qd-row">';
  for(var qi=0;qi<4;qi++)h+='<input class="qdinp" value="'+(S.quickDenoms[qi]/1000)+'" oninput="upQD('+qi+',this.value)" type="number" step="0.5" min="0.5" placeholder="k">';
  h+='</div>';
  h+='<div class="slbl" style="margin-bottom:6px">Ghi chú trận (tối đa 80 ký tự)</div>';
  h+='<input class="snm" value="'+esc(S.pinnedNote)+'" maxlength="80" oninput="S.pinnedNote=this.value" placeholder="Nhập ghi chú"></div>';
  h+='<div style="margin-top:6px;padding:10px 13px;background:var(--sf);border:1px solid var(--bd);border-radius:10px;display:flex;justify-content:space-between;align-items:center">';
  h+='<span style="font-size:11px;color:var(--dim)">Tổng vốn vào bàn'+(S.potEnabled?' + quỹ':'')+'</span>';
  h+='<span id="totLbl" style="font-family:monospace;font-size:14px;font-weight:800;color:var(--gld)">'+ff(totInit()+S.pot)+'</span></div></div>';
  h+='<button class="sbt" onclick="startG()">BẮT ĐẦU TRẬN ĐẤU ▶</button>';
  if(S.sessions.length>0)h+='<button onclick="showSess()" class="btn-ghost" style="margin-top:8px">&#128203; Lịch sử ('+S.sessions.length+' trận đấu)</button>';
  h+='</div>';return h}

/* ===== PLAY ===== */
function rPlay(){
  var tot=totBal()+S.pot,ti=totInit()+S.pot,ok=(tot===ti),undoCnt=S.undoStack.length,mode=cardMode();
  var showTimer=(S.showTimerAlways||S.timer.running||getElapsed()>0);
  var isMobile=(window.innerWidth<640);
  var h='<div class="hd"><div class="hd-l"><h1>VÍ TRUNG TÂM</h1>';
  h+='<div class="rnd" onclick="incRound()">Vòng <b>'+S.round+'</b></div></div>';
  if(showTimer&&isMobile)h+='<button id="timerElBtn" class="timer-btn '+(S.timer.running?'run':'pause')+'" onclick="toggleTimer()">'+(S.timer.running?'⏸ ':'▶ ')+'<span id="timerEl">'+fmtTime(getElapsed())+'</span></button>';
  h+='<div class="hd-r">';
  h+='<button class="ib'+(undoCnt>0?' hot':'')+'" onclick="showUndoHist()" title="Hoàn tác">↺'+(undoCnt>0?' '+undoCnt:'')+'</button>';
  h+='<button class="ib'+(S.sortDesc?' hot':'')+'" onclick="toggleSort()" title="Sắp xếp">⇅</button>';
  h+='<button class="ib'+(S.compact?' hot':'')+'" onclick="toggleCompact()" title="Chế độ gọn">'+(S.compact?'≡':'⊞')+'</button>';
  h+='<button class="ib" onclick="showSettings()" title="Cài đặt">⚙</button>';
  h+='<button class="ib" onclick="showSess()" title="Lịch sử trận">📋</button>';
  h+='<button class="ib" onclick="showReset()" title="Đặt lại">⊙</button>';
  h+='</div></div>';
  if(S.pinnedNote&&!S.hidePinned)h+='<div class="note"><span>'+esc(S.pinnedNote)+'</span><button class="mc" style="width:22px;height:22px" onclick="S.hidePinned=true;render()">×</button></div>';
  h+='<div class="ckb"><span>'+S.hist.length+' GD &bull; Tổng: <b style="color:var(--tx)">'+ff(tot)+'</b></span>';
  h+='<span class="'+(ok?'ok':'er')+'">'+(ok?'&#10003; Hợp lệ':'&#10007; LỆCH')+'</span></div>';
  if(showTimer&&!isMobile){h+='<div style="padding:7px 13px;border-bottom:1px solid var(--bd);display:flex;justify-content:flex-end"><button id="timerElBtn" class="timer-btn '+(S.timer.running?'run':'pause')+'" onclick="toggleTimer()">'+(S.timer.running?'⏸ ':'▶ ')+'<span id="timerEl">'+fmtTime(getElapsed())+'</span></button></div>'}
  h+='<div class="pls">';
  if(S.potEnabled){h+='<div class="pc compact" onclick="openPotAct()"><div class="stripe" style="background:var(--gld)"></div><div class="pc-body"><div class="av" style="background:var(--gld)">💰</div><div class="inf"><div class="nm">Quỹ chung</div><div class="bal">'+ff(S.pot)+'</div></div></div><div class="pc-r"><div class="dl dz">Quỹ</div></div></div>'}
  var idxs=[];for(var k=0;k<S.players.length;k++)idxs.push(k);
  if(S.sortDesc)idxs.sort(function(a,b){return S.players[b].balance-S.players[a].balance});
  for(var ii=0;ii<idxs.length;ii++){
    var i=idxs[ii];var p=S.players[i];var d=p.balance-p.initial;
    var dc=d>0?'dp':d<0?'dn':'dz';var ds=d>0?'+'+fmt(d):d<0?fmt(d):'0';
    var bust=(p.balance===0);var warn=(!bust&&p.balance<p.initial*.25);
    h+='<div class="pc '+mode+(bust?' bust':warn?' warn':'')+'"><div class="stripe" style="background:'+p.color+'"></div>';
    h+='<div class="pc-body" onclick="openAct('+i+')">';
    h+=avHtml(p,'av');
    h+='<div class="inf"><div class="nm">'+esc(p.name);
    if(S.showRanks){var rk=rankAt(i);h+='<span class="rank-badge">'+rankLabel(rk)+'</span>'}
    if(bust)h+='<span class="tag" style="background:rgba(220,38,38,.1);color:var(--red)">HẾT TIỀN</span>';
    else if(warn)h+='<span class="tag" style="background:rgba(224,96,48,.1);color:var(--orn)">SẮP HẾT</span>';
    h+='</div><div class="bal">'+ff(p.balance)+'</div></div></div>';
    h+='<div class="pc-r"><div class="dl '+dc+'">'+ds+'</div>';
    h+='<div class="qa-r">';
    h+='<div class="qa qs" onclick="openActQ(event,'+i+',\'send\')" title="Gửi cho tất cả">&#8594;</div>';
    h+='<div class="qa qr" onclick="openActQ(event,'+i+',\'receive\')" title="Nhận từ tất cả">&#8592;</div>';
    h+='</div></div></div>'}
  h+='</div><div class="hs"><div class="hs-hd">Giao dịch gần đây</div>';
  h+='<div style="display:flex;gap:4px;overflow:auto;margin-bottom:5px"><button class="btn-ghost" style="margin:0;padding:5px 8px;font-size:10px" onclick="setHistFilter(-1)">Tất cả</button>';
  for(var hf=0;hf<S.players.length;hf++)h+='<button class="btn-ghost" style="margin:0;padding:5px 8px;font-size:10px" onclick="setHistFilter('+hf+')">'+esc(S.players[hf].name)+'</button>';
  h+='</div><div class="hl">';
  if(S.hist.length===0)h+='<div class="hi" style="text-align:center;opacity:.4">Chưa có giao dịch</div>';
  else{var fr=S.hist.length-1;var shown=0;for(var i=fr;i>=0&&shown<50;i--){if(S.histFilter>=0){var e=S.hist[i];if(e.f!==S.histFilter&&e.t.indexOf(S.histFilter)<0)continue}shown++;h+='<div class="hi"><span style="opacity:.4">'+S.hist[i].time+'</span> '+esc(S.hist[i].text)+'</div>'}}
  h+='</div></div><div id="toast-root" class="toast-wrap"></div>';return h}

/* ===== ACTION MODAL ===== */
function rActModal(){
  var p=(S.ap===-1?{name:'Quỹ chung',emoji:'💰',color:'#c9860c',balance:S.pot}:S.players[S.ap]);var is=(S.atab==='send');
  var h='<div class="mo" onclick="clMo(event)"><div class="md" onclick="event.stopPropagation()">';
  h+='<div class="mh"><h2>'+avHtml(p,'av2',16)+' '+esc(p.name)+'</h2><button class="mc" onclick="clMoF()">&#10005;</button></div>';
  h+='<div style="text-align:center;margin-bottom:12px;font-family:monospace;font-size:28px;font-weight:800">'+ff(p.balance)+'</div>';
  h+='<div class="mtabs"><button id="t0" class="mtab'+(is?' on':'')+'" onclick="setTab(\'send\')">&#8594; GỬI</button><button id="t1" class="mtab'+(!is?' on':'')+'" onclick="setTab(\'receive\')">&#8592; NHẬN</button></div>';
  if(S.txTemplates.length>0){h+='<div class="slbl">MẪU GIAO DỊCH</div><div style="display:flex;gap:5px;overflow:auto;margin-bottom:8px">';for(var ti=0;ti<S.txTemplates.length;ti++){h+='<button class="btn-ghost" style="margin:0;padding:6px 8px;white-space:nowrap" onclick="applyTpl('+ti+')">★ '+esc(S.txTemplates[ti].name)+'</button>'}h+='</div>'}
  h+='<div class="slbl">NHANH &mdash; CHỌN LUÔN TẤT CẢ</div>';
  h+='<div class="qrow">';
  for(var di=0;di<4;di++){h+='<button class="qrb '+(is?'qs':'qr')+'" onclick="quickAllByIdx('+di+')">'+(is?'&#8594;':'&#8592;')+fmt(S.quickDenoms[di])+'</button>'}
  h+='<button class="qrb" onclick="openCustomAmt()">Khác...</button>';
  h+='</div>';
  h+='<div class="slbl">SỐ TIỀN</div><div class="ag">';
  for(var di=0;di<DENOMS.length;di++){var d=DENOMS[di];h+='<button class="ab" data-amt="'+d+'" onclick="setAmt('+d+')">'+fmt(d)+'</button>'}
  h+='</div>';
  h+='<div class="ca"><input type="number" id="camt" placeholder="Số khác" oninput="setCamt(this.value)" step="0.5" min="0"><span>x 1.000đ</span></div>';
  h+='<div class="slbl" id="tgtLbl">'+(is?'GỬI CHO':'NHẬN TỪ')+'</div>';
  h+='<button class="albt" id="btnAll" onclick="togAll()">'+(is?'▶ Gửi cho TẤT CẢ':'◀ Nhận từ TẤT CẢ')+'</button>';
  h+='<div class="tg">';
  if(S.potEnabled&&S.ap!==-1)h+='<div class="tr" data-idx="-1" onclick="togTgt(-1)"><div class="av2" style="background:var(--gld)">💰</div><span class="tn">Quỹ chung</span><span class="tb">'+ff(S.pot)+'</span><span class="ck2">&#10003;</span></div>';
  for(var i=0;i<S.players.length;i++){if(i===S.ap)continue;var o=S.players[i];
    h+='<div class="tr" data-idx="'+i+'" onclick="togTgt('+i+')">'+avHtml(o,'av2',16)+'<span class="tn">'+esc(o.name)+'</span><span class="tb">'+ff(o.balance)+'</span><span class="ck2">&#10003;</span></div>'}
  h+='</div>';
  h+='<button class="btn-ghost" onclick="saveTpl()">★ Lưu mẫu</button><div class="errmsg" id="errMsg"></div>';
  h+='<button class="exb '+(is?'s':'r')+'" id="btnExec" onclick="execAct()" disabled>'+(is?'GỬI':'NHẬN')+'</button>';
  h+='</div></div>';return h}

/* ===== DOM TARGETED — no re-render, no scroll jump ===== */
function updAmt(){
  var btns=document.querySelectorAll('.ab');
  for(var i=0;i<btns.length;i++){if(parseInt(btns[i].getAttribute('data-amt'),10)===S.aamt)btns[i].classList.add('sel');else btns[i].classList.remove('sel')}
  updBtn()}
function updTgt(){
  var rows=document.querySelectorAll('.tr');
  for(var i=0;i<rows.length;i++){var idx=parseInt(rows[i].getAttribute('data-idx'),10);if(S.atgt.indexOf(idx)>=0)rows[i].classList.add('sel');else rows[i].classList.remove('sel')}
  var others=[];for(var i=0;i<S.players.length;i++){if(i!==S.ap)others.push(i)}if(S.potEnabled&&S.ap!==-1)others.push(-1);
  var ba=$('btnAll');
  if(ba){
    if(S.atgt.length===others.length&&others.length>0){
      ba.classList.add('sel');
      ba.style.background='';
      ba.style.borderColor='';
      ba.style.color='';
      ba.textContent='✓ Đã chọn TẤT CẢ — Bỏ chọn';
    }else if(S.atgt.length>0){
      ba.classList.remove('sel');
      ba.style.background='rgba(201,134,12,.06)';
      ba.style.borderColor='rgba(201,134,12,.5)';
      ba.style.color='var(--gld)';
      ba.textContent=(S.atab==='send'?'▶ Gửi cho ':'◀ Nhận từ ')+S.atgt.length+' người';
    }else{
      ba.classList.remove('sel');
      ba.style.background='';
      ba.style.borderColor='';
      ba.style.color='';
      ba.textContent=(S.atab==='send'?'▶ Gửi cho TẤT CẢ':'◀ Nhận từ TẤT CẢ');
    }
  }
  updBtn()}
function updBtn(){
  var btn=$('btnExec');if(!btn)return;
  var is=(S.atab==='send');
  btn.disabled=(S.aamt<=0||S.atgt.length===0);
  var lbl=is?'GỬI':'NHẬN';
  if(S.aamt>0&&S.atgt.length>0)lbl+=' '+fmt(S.aamt)+' x '+S.atgt.length+' = '+ff(S.aamt*S.atgt.length);
  btn.textContent=lbl}

/* setTab: PURE DOM, zero scroll jump */
function setTab(t){
  S.atab=t;S.atgt=[];S.aamt=0;var is=(t==='send');
  var t0=$('t0');var t1=$('t1');
  if(t0){if(is)t0.classList.add('on');else t0.classList.remove('on')}
  if(t1){if(!is)t1.classList.add('on');else t1.classList.remove('on')}
  var lbl=$('tgtLbl');if(lbl)lbl.textContent=is?'GỬI CHO':'NHẬN TỪ';
  var ba=$('btnAll');if(ba){ba.textContent=is?'▶ Gửi cho TẤT CẢ':'◀ Nhận từ TẤT CẢ';ba.classList.remove('sel');ba.style.background='';ba.style.borderColor='';ba.style.color=''}
  var exb=$('btnExec');if(exb){exb.classList.remove('s','r');exb.classList.add(is?'s':'r')}
  var qbs=document.querySelectorAll('.qrb');
  for(var i=0;i<qbs.length&&i<4;i++){qbs[i].classList.remove('qs','qr');qbs[i].classList.add(is?'qs':'qr');qbs[i].textContent=(is?'\u2192':'\u2190')+fmt(S.quickDenoms[i])}
  var ci=$('camt');if(ci)ci.value='';
  updAmt();updTgt()}

function setAmt(a){S.aamt=a;var ci=$('camt');if(ci)ci.value='';updAmt()}
function setCamt(v){var n=parseFloat(v)*1000;S.aamt=(!isNaN(n)&&n>0)?n:0;var btns=document.querySelectorAll('.ab');for(var i=0;i<btns.length;i++)btns[i].classList.remove('sel');updBtn()}
function togTgt(idx){var i=S.atgt.indexOf(idx);if(i>=0)S.atgt.splice(i,1);else S.atgt.push(idx);updTgt()}
function togAll(){var others=[];for(var i=0;i<S.players.length;i++){if(i!==S.ap)others.push(i)}if(S.potEnabled&&S.ap!==-1)others.push(-1);if(S.atgt.length===others.length){S.atgt=[]}else{S.atgt=[];for(var i=0;i<others.length;i++)S.atgt.push(others[i])}updTgt()}
function quickAllByIdx(qi){
  S.aamt=S.quickDenoms[qi];
  var others=[];for(var i=0;i<S.players.length;i++){if(i!==S.ap)others.push(i)}if(S.potEnabled&&S.ap!==-1)others.push(-1);
  S.atgt=[];for(var i=0;i<others.length;i++)S.atgt.push(others[i]);
  var ci=$('camt');if(ci)ci.value='';updAmt();updTgt()}
function openCustomAmt(){var ci=$('camt');if(ci){ci.focus();ci.select()}}
function showErr(msg){var el=$('errMsg');if(!el)return;el.innerHTML='<span>'+esc(msg)+'</span><button style="float:right;border:none;background:transparent;color:var(--red);cursor:pointer" onclick="this.parentNode.style.display=\'none\'">×</button>';el.style.display='block';clearTimeout(el._t);el._t=setTimeout(function(){if(el)el.style.display='none'},4000)}
function saveTpl(){
  if(S.aamt<=0||S.atgt.length===0){showErr('Cần chọn số tiền và người nhận');return}
  var saveBtn=document.querySelector('[onclick="saveTpl()"]');
  if(!saveBtn)return;
  var defaultName='Mẫu '+(S.txTemplates.length+1);
  saveBtn.outerHTML='<div id="tplNameRow" style="display:flex;gap:5px;margin-bottom:6px"><input id="tplNameInp" class="snm" style="flex:1" placeholder="Tên mẫu" value="'+esc(defaultName)+'"><button onclick="confirmSaveTpl()" style="padding:6px 10px;border-radius:7px;background:var(--gld);border:none;color:#fff;font-weight:700;cursor:pointer;font-size:12px">Lưu</button><button onclick="cancelSaveTpl()" style="padding:6px 10px;border-radius:7px;background:var(--sf2);border:1px solid var(--bd);color:var(--dim);cursor:pointer;font-size:12px">Hủy</button></div>';
  var inp=$('tplNameInp');
  if(inp){inp.focus();inp.select()}
}
function confirmSaveTpl(){
  var inp=$('tplNameInp');
  var n=inp?inp.value.trim():'';
  if(!n)n='Mẫu '+(S.txTemplates.length+1);
  var t={name:n,tab:S.atab,amt:S.aamt,selectAll:(S.atgt.length===S.players.length-1)};
  if(S.txTemplates.length>=5)S.txTemplates.shift();
  S.txTemplates.push(t);
  saveState();
  var row=$('tplNameRow');
  if(row)row.outerHTML='<button class="btn-ghost" onclick="saveTpl()">★ Lưu mẫu</button>';
}
function cancelSaveTpl(){var row=$('tplNameRow');if(row)row.outerHTML='<button class="btn-ghost" onclick="saveTpl()">★ Lưu mẫu</button>'}
function applyTpl(i){var t=S.txTemplates[i];if(!t)return;setTab(t.tab);S.aamt=t.amt;if(t.selectAll)togAll();updAmt()}

/* ===== EXECUTE ===== */
function execAct(){
  var amt=S.aamt,pi=S.ap,p=S.players[pi],is=(S.atab==='send'),tgts=S.atgt.slice();
  if(amt<=0||tgts.length===0)return;
  var srcBal=(pi===-1?S.pot:p.balance);
  if(is){if(srcBal<amt*tgts.length){showErr((pi===-1?'Quỹ chung':p.name)+' không đủ tiền! Thiếu '+ff(amt*tgts.length-srcBal));return}}
  else{for(var i=0;i<tgts.length;i++){if(tgts[i]===-1){if(S.pot<amt){showErr('Quỹ chung không đủ tiền (có '+ff(S.pot)+')');return}}else{var tp=S.players[tgts[i]];if(tp.balance<amt){showErr(tp.name+' không đủ tiền (có '+ff(tp.balance)+')');return}}}}
  var snap=[];for(var i=0;i<S.players.length;i++)snap.push(S.players[i].balance);
  var snapPot=S.pot;
  var names=[];
  if(is){
    if(pi===-1)S.pot-=amt*tgts.length;else p.balance-=amt*tgts.length;
    for(var i=0;i<tgts.length;i++){if(tgts[i]===-1){S.pot+=amt;names.push('Quỹ chung')}else{S.players[tgts[i]].balance+=amt;names.push(S.players[tgts[i]].name)}}
    S.hist.push({time:tnow(),text:(pi===-1?'Quỹ chung':p.name)+' → '+names.join(', ')+': '+ff(amt)+(tgts.length>1?' mỗi người':''),f:pi,t:tgts.slice(),a:amt,tp:'s'})
  }else{
    for(var i=0;i<tgts.length;i++){if(tgts[i]===-1){S.pot-=amt;names.push('Quỹ chung')}else{S.players[tgts[i]].balance-=amt;names.push(S.players[tgts[i]].name)}}
    if(pi===-1)S.pot+=amt*tgts.length;else p.balance+=amt*tgts.length;
    S.hist.push({time:tnow(),text:(pi===-1?'Quỹ chung':p.name)+' ← '+names.join(', ')+': '+ff(amt)+(tgts.length>1?' mỗi người':''),f:pi,t:tgts.slice(),a:amt,tp:'r'})
  }
  S.undoStack.push({snap:snap,snapPot:snapPot,idx:S.hist.length-1});
  if(S.undoStack.length>20)S.undoStack.shift();
  for(var bi=0;bi<S.players.length;bi++){if(S.players[bi].balance===0)pushToast('💥 '+S.players[bi].name+' vừa hết tiền!')}
  var leader=-1;var leaderBal=-1;
  for(var bi=0;bi<S.players.length;bi++){if(S.players[bi].balance>leaderBal){leaderBal=S.players[bi].balance;leader=bi}}
  var prevLeader=-1;var prevLeaderBal=-1;
  for(var bj=0;bj<snap.length;bj++){if(snap[bj]>prevLeaderBal){prevLeaderBal=snap[bj];prevLeader=bj}}
  if(leader!==prevLeader&&leader>=0)pushToast('🏆 '+S.players[leader].name+' đang dẫn đầu!');
  vib(25);coin(is?'s':'r');showUndoBar();clMoF();render()}

/* ===== UNDO ===== */
function showUndoBar(){
  if(S.undoTimer)clearTimeout(S.undoTimer);
  var ur=$('undo-root');
  var txt=S.hist.length>0?S.hist[S.hist.length-1].text:'';
  ur.innerHTML='<div class="ub"><span>'+esc(txt)+'</span><button onclick="doUndo()">HOÀN TÁC</button></div>';
  S.undoTimer=setTimeout(function(){ur.innerHTML=''},6000)}
function doUndo(){
  if(S.undoStack.length===0)return;
  var u=S.undoStack.pop();
  for(var i=0;i<u.snap.length;i++)S.players[i].balance=u.snap[i];
  if(typeof u.snapPot!=='undefined')S.pot=u.snapPot;
  S.hist.splice(u.idx,1);
  $('undo-root').innerHTML='';if(S.undoTimer)clearTimeout(S.undoTimer);
  vib([15,10,15]);render()}

/* ===== STATS ===== */
function calcStats(){
  var s=[];for(var i=0;i<S.players.length;i++)s.push({out:0,inp:0,cnt:0});
  for(var h=0;h<S.hist.length;h++){
    var e=S.hist[h];if(!e.t)continue;
    if(e.tp==='s'){if(e.f>=0){s[e.f].out+=e.a*e.t.length;s[e.f].cnt++}for(var j=0;j<e.t.length;j++)if(e.t[j]>=0)s[e.t[j]].inp+=e.a}
    else if(e.tp==='r'){if(e.f>=0){s[e.f].inp+=e.a*e.t.length;s[e.f].cnt++}for(var j=0;j<e.t.length;j++)if(e.t[j]>=0)s[e.t[j]].out+=e.a}}
  return s}
function calcDebts(){
  var balances=[];for(var i=0;i<S.players.length;i++){var net=S.players[i].balance-S.players[i].initial;if(Math.abs(net)>0)balances.push({idx:i,net:net})}
  var debtors=[],creditors=[];for(var j=0;j<balances.length;j++){if(balances[j].net<0)debtors.push({idx:balances[j].idx,amt:-balances[j].net});else if(balances[j].net>0)creditors.push({idx:balances[j].idx,amt:balances[j].net})}
  var txs=[],di=0,ci=0;while(di<debtors.length&&ci<creditors.length){var d=debtors[di],c=creditors[ci],amt=Math.min(d.amt,c.amt);txs.push({from:d.idx,to:c.idx,amount:amt});d.amt-=amt;c.amt-=amt;if(d.amt===0)di++;if(c.amt===0)ci++}
  return txs
}

/* ===== UNDO HISTORY & STATS MODAL ===== */
var uhTab='hist';
var statsSort='delta';
function showUndoHist(){uhTab='hist';renderUhModal()}
function renderUhModal(){
  var undoCnt=S.undoStack.length;
  var h='<div class="mo" onclick="clMo(event)"><div class="md" onclick="event.stopPropagation()">';
  h+='<div class="mh"><h2>&#8635; Lịch sử & Thống kê</h2><button class="mc" onclick="clMoF()">&#10005;</button></div>';
  h+='<div class="mtabs"><button id="uht0" class="mtab'+(uhTab==='hist'?' on':'')+'" onclick="setUhTab(\'hist\')">&#128195; Giao dịch</button><button id="uht1" class="mtab'+(uhTab==='stats'?' on':'')+'" onclick="setUhTab(\'stats\')">&#128202; Thống kê</button><button class="mtab'+(uhTab==='res'?' on':'')+'" onclick="setUhTab(\'res\')">🏁 Kết quả</button></div>';
  h+='<div id="uhc0" style="'+(uhTab!=='hist'?'display:none':'')+'"">';
  if(undoCnt>0)h+='<button onclick="doUndoH()" style="width:100%;padding:10px;border-radius:10px;background:rgba(201,134,12,.1);border:1.5px solid rgba(201,134,12,.35);color:var(--gld);font-size:13px;font-weight:800;cursor:pointer;margin-bottom:12px">&#8635; HOÀN TÁC GD GẦN NHẤT <span style="font-size:11px;opacity:.7">(còn '+undoCnt+' lần)</span></button>';
  else h+='<div style="padding:4px 0 10px;font-size:11px;color:var(--dim)">Không còn giao dịch để hoàn tác.</div>';
  if(S.hist.length===0)h+='<div style="text-align:center;padding:16px;color:var(--dim);font-size:12px">Chưa có giao dịch</div>';
  else{h+='<div class="slbl" style="margin-bottom:6px">Tất cả giao dịch</div>';
    h+='<select onchange="setHistFilterFromSel(this.value)" style="width:100%;padding:8px;border:1px solid var(--bd);border-radius:8px;margin-bottom:7px;background:var(--bg);color:var(--tx)"><option value="-1">Lọc: Tất cả</option>';
    for(var op=0;op<S.players.length;op++)h+='<option value="'+op+'" '+(S.histFilter===op?'selected':'')+'>'+esc(S.players[op].name)+'</option>';
    h+='</select>';
    var fr=S.hist.length-1;var cnt=0;
    for(var i=fr;i>=0&&cnt<999;i--){if(S.histFilter>=0&&S.hist[i].f!==S.histFilter&&S.hist[i].t.indexOf(S.histFilter)<0)continue;cnt++;h+='<div class="uhrow"><span class="uhnum">'+(i+1)+'</span><span class="uhtxt">'+esc(S.hist[i].text)+'</span><span class="uhtime">'+S.hist[i].time+'</span></div>'}}
  h+='<button onclick="copyResult()" class="btn-ghost" style="margin-top:8px">&#128203; Sao chép kết quả hiện tại</button>';
  h+='</div>';
  h+='<div id="uhc1" style="'+(uhTab!=='stats'?'display:none':'')+'">';
  var stats=calcStats();
  h+='<div style="display:flex;gap:8px;margin-bottom:12px">';
  h+='<div style="flex:1;padding:10px;background:var(--bg);border-radius:10px;text-align:center"><div style="font-family:monospace;font-size:16px;font-weight:800;color:var(--gld)">'+S.hist.length+'</div><div style="font-size:10px;color:var(--dim);margin-top:2px">Giao dịch</div></div>';
  h+='<div style="flex:1;padding:10px;background:var(--bg);border-radius:10px;text-align:center"><div style="font-family:monospace;font-size:16px;font-weight:800;color:var(--grn)">'+S.round+'</div><div style="font-size:10px;color:var(--dim);margin-top:2px">Vòng</div></div>';
  h+='<div style="flex:1;padding:10px;background:var(--bg);border-radius:10px;text-align:center"><div style="font-family:monospace;font-size:16px;font-weight:800;color:var(--tx)">'+S.players.length+'</div><div style="font-size:10px;color:var(--dim);margin-top:2px">Người chơi</div></div>';
  var flowVol=0;for(var fv=0;fv<S.hist.length;fv++){if(S.hist[fv].t)flowVol+=S.hist[fv].a*S.hist[fv].t.length}
  h+='<div style="flex:1;padding:10px;background:var(--bg);border-radius:10px;text-align:center"><div style="font-family:monospace;font-size:16px;font-weight:800;color:var(--pur)">'+fmt(flowVol)+'</div><div style="font-size:10px;color:var(--dim);margin-top:2px">Tiền lưu thông</div></div>';
  h+='</div>';
  h+='<div class="stat-hd"><div style="width:32px;flex-shrink:0"></div><div style="flex:1"></div><div class="stat-col" style="color:var(--red);cursor:pointer" onclick="setSortStats(\'out\')">Đã trả'+(statsSort==='out'?' ↓':'')+'</div><div class="stat-col" style="color:var(--grn);cursor:pointer" onclick="setSortStats(\'inp\')">Đã nhận'+(statsSort==='inp'?' ↓':'')+'</div><div class="stat-col" style="cursor:pointer" onclick="setSortStats(\'delta\')">Chênh lệch'+(statsSort==='delta'?' ↓':'')+'</div></div>';
  var sorted=[];for(var i=0;i<S.players.length;i++)sorted.push(i);
  sorted.sort(function(a,b){if(statsSort==='name')return S.players[a].name.localeCompare(S.players[b].name);if(statsSort==='count')return stats[b].cnt-stats[a].cnt;if(statsSort==='out')return stats[b].out-stats[a].out;if(statsSort==='inp')return stats[b].inp-stats[a].inp;return (S.players[b].balance-S.players[b].initial)-(S.players[a].balance-S.players[a].initial)});
  for(var si=0;si<sorted.length;si++){var i=sorted[si];var p=S.players[i];var st=stats[i];var nd=p.balance-p.initial;var dc2=nd>0?'var(--grn)':nd<0?'var(--red)':'var(--dim)';
    h+='<div class="stat-r">'+avHtml(p,'stat-av',16)+'<span class="stat-nm">'+esc(p.name)+'</span>';
    h+='<div class="stat-col" style="color:var(--red)">'+fmt(st.out)+'</div>';
    h+='<div class="stat-col" style="color:var(--grn)">'+fmt(st.inp)+'</div>';
    h+='<div class="stat-col" style="color:'+dc2+';font-weight:800">'+(nd>=0?'+':'')+fmt(nd)+'</div></div>';
    h+='<div style="height:4px;border-radius:3px;background:var(--sf2);margin:-2px 10px 6px 52px"><div style="height:4px;border-radius:3px;background:'+(nd>=0?'var(--grn)':'var(--red)')+';width:'+Math.min(100,Math.abs(nd)/Math.max(1,Math.abs(S.players[sorted[0]].balance-S.players[sorted[0]].initial))*100)+'%"></div></div>'}
  h+='</div>';
  h+='<div id="uhc2" style="'+(uhTab!=='res'?'display:none':'')+'">';
  var debts=calcDebts();
  h+='<div class="slbl">Thanh toán cuối trận</div>';
  if(debts.length===0)h+='<div class="hi">Không có khoản nợ cần thanh toán</div>';
  else{for(var di2=0;di2<debts.length;di2++){var dtx=debts[di2];h+='<div class="hi" style="display:flex;align-items:center;gap:7px">'+avHtml(S.players[dtx.from],'av2',14)+'<span>'+esc(S.players[dtx.from].name)+'</span><span style="opacity:.6">→</span>'+avHtml(S.players[dtx.to],'av2',14)+'<span>'+esc(S.players[dtx.to].name)+':</span><b style="margin-left:auto">'+ff(dtx.amount)+'</b></div>'}}
  h+='<button class="btn-ghost" onclick="copyResult()">Sao chép để chia sẻ</button></div>';
  h+='</div></div>';
  $('modal-root').innerHTML=h;S.modal='__uh__'}
function doUndoH(){doUndo();if($('modal-root').innerHTML)renderUhModal()}
function setSortStats(col){statsSort=col;renderUhModal()}

/* ===== RESET MODAL ===== */
function showReset(){
  var h='<div class="mo" onclick="clMo(event)"><div class="md" onclick="event.stopPropagation()">';
  h+='<div class="mh"><h2>&#9111; Tùy chọn đặt lại</h2><button class="mc" onclick="clMoF()">&#10005;</button></div>';
  h+='<button class="ropt" onclick="resetBal()"><span class="ico">&#9654;&#9654;</span><div><div>Đặt lại số dư &mdash; tiếp tục chơi</div><div class="rdesc">Giữ tên và cấu hình. Đặt lại tiền về ban đầu. Lưu kết quả vào lịch sử. Vòng reset về 1.</div></div></button>';
  h+='<button class="ropt" onclick="resetTimerOnly()"><span class="ico">⏱</span><div><div>Chỉ reset vòng và đồng hồ</div><div class="rdesc">Giữ nguyên số dư. Reset vòng về 1 và đồng hồ về 0. KHÔNG lưu lịch sử.</div></div></button>';
  h+='<button class="ropt" onclick="resetNew()"><span class="ico">&#128260;</span><div><div>Trận đấu mới</div><div class="rdesc">Lưu kết quả trận này, quay về màn hình thiết lập.</div></div></button>';
  h+='<button class="ropt dng" onclick="resetHard()"><span class="ico">&#128465;</span><div><div>Xóa toàn bộ dữ liệu</div><div class="rdesc">Xóa lịch sử, xóa tiến trình. Không thể hoàn tác.</div></div></button>';
  h+='</div></div>';$('modal-root').innerHTML=h;S.modal='__rst__'}

function saveSess(){
  if(S.hist.length===0)return;
  var res=[];for(var i=0;i<S.players.length;i++){var p=S.players[i];res.push({name:p.name,color:p.color,emoji:p.emoji||'',balance:p.balance,initial:p.initial})}
  S.sessions.push({date:new Date().toLocaleString('vi-VN'),results:res,txCount:S.hist.length,rounds:S.round})}
function confirmModal(msg,onYes){
  var mr=$('modal-root');
  mr.innerHTML='<div class="mo" style="z-index:110" onclick="closeConfirm()"><div class="md" style="max-height:auto" onclick="event.stopPropagation()"><div style="font-size:14px;font-weight:600;margin-bottom:16px;line-height:1.5">'+esc(msg)+'</div><div style="display:flex;gap:8px"><button onclick="closeConfirm()" style="flex:1;padding:11px;border-radius:10px;background:var(--sf2);border:1px solid var(--bd);font-size:13px;font-weight:700;cursor:pointer">Hủy</button><button id="confirmYes" style="flex:1;padding:11px;border-radius:10px;background:var(--red);border:none;color:#fff;font-size:13px;font-weight:700;cursor:pointer">Xác nhận</button></div></div></div>';
  $('confirmYes').onclick=function(){closeConfirm();onYes()}
}
function closeConfirm(){$('modal-root').innerHTML=''}
function resetTimerOnly(){S.round=1;resetTimer();if(timerInterval){clearInterval(timerInterval);timerInterval=null}if(S.autoTimerStart){startTimer();startTimerTick()}clMoF();render()}

function resetBal(){
  confirmModal('Đặt lại số dư về ban đầu? Kết quả sẽ lưu vào lịch sử.',function(){
    saveSess();for(var i=0;i<S.players.length;i++)S.players[i].balance=S.players[i].initial;
    S.hist=[];S.undoStack=[];S.round=1;resetTimer();if(S.autoTimerStart){startTimer();startTimerTick()}
    $('undo-root').innerHTML='';clMoF();render()
  })}
function resetNew(){
  confirmModal('Kết thúc trận đấu? Kết quả sẽ lưu vào lịch sử.',function(){
    saveSess();S.phase='setup';S.hist=[];S.undoStack=[];S.round=1;
    for(var i=0;i<S.players.length;i++)S.players[i].balance=S.players[i].initial;
    resetTimer();
    if(timerInterval){clearInterval(timerInterval);timerInterval=null}
    $('undo-root').innerHTML='';clMoF();render()
  })}
function resetHard(){
  confirmModal('XÓA TOÀN BỘ dữ liệu? Không thể hoàn tác!',function(){
    S.sessions=[];S.phase='setup';S.hist=[];S.undoStack=[];S.round=1;
    S.players=mkPlayers(5);$('undo-root').innerHTML='';clMoF();
    try{localStorage.removeItem('wc_v13');localStorage.removeItem('wc_v12')}catch(e){}
    render()
  })}

/* ===== SESSIONS MODAL ===== */
function showSess(){
  var h='<div class="mo" onclick="clMo(event)"><div class="md" onclick="event.stopPropagation()">';
  h+='<div class="mh"><h2>&#128203; Lịch sử trận đấu</h2><button class="mc" onclick="clMoF()">&#10005;</button></div>';
  if(S.sessions.length===0)h+='<p style="color:var(--dim);text-align:center;padding:24px;font-size:13px">Chưa có trận đấu nào</p>';
  else{for(var si=S.sessions.length-1;si>=0;si--){var ss=S.sessions[si];
    h+='<div class="ss"><div class="sd">'+esc(ss.date)+' &bull; '+ss.txCount+' GD'+(ss.rounds?' &bull; '+ss.rounds+' vòng':'')+'</div><div class="sr">';
    for(var ri=0;ri<ss.results.length;ri++){var r=ss.results[ri];var rd=r.balance-r.initial;var rc=rd>0?'dp':rd<0?'dn':'dz';
      h+='<span class="sc2 '+rc+'" style="border-left:2px solid '+r.color+'">'+esc(r.name)+': '+(rd>0?'+':'')+fmt(rd)+'</span>'}
    h+='</div></div>'}
    h+='<button onclick="clrSess()" class="btn-ghost dng">Xóa tất cả lịch sử</button>'}
  h+='</div></div>';$('modal-root').innerHTML=h;S.modal='__ss__'}
function clrSess(){confirmModal('Xóa tất cả lịch sử?',function(){S.sessions=[];saveState();showSess()})}
function showSettings(){
  var h='<div class="mo" onclick="clMo(event)"><div class="md" onclick="event.stopPropagation()">';
  h+='<div class="mh"><h2>⚙ Cài đặt</h2><button class="mc" onclick="clMoF()">×</button></div>';
  h+='<div class="slbl">HIỂN THỊ</div>';
  h+='<label style="display:flex;gap:8px;margin-bottom:6px"><input type="checkbox" '+(S.compact?'checked':'')+' onchange="S.compact=this.checked"> Chế độ thẻ gọn</label>';
  h+='<label style="display:flex;gap:8px;margin-bottom:6px"><input type="checkbox" '+(S.showTimerAlways?'checked':'')+' onchange="S.showTimerAlways=this.checked"> Luôn hiển thị đồng hồ</label>';
  h+='<label style="display:flex;gap:8px;margin-bottom:10px"><input type="checkbox" '+(S.showRanks?'checked':'')+' onchange="S.showRanks=this.checked"> Hiển thị thứ hạng trên thẻ</label>';
  h+='<div class="slbl">ÂM THANH & RUNG</div>';
  h+='<label style="display:flex;gap:8px;margin-bottom:6px"><input type="checkbox" '+(S.soundEnabled?'checked':'')+' onchange="S.soundEnabled=this.checked"> Âm thanh giao dịch</label>';
  h+='<label style="display:flex;gap:8px;margin-bottom:10px"><input type="checkbox" '+(S.vibrateEnabled?'checked':'')+' onchange="S.vibrateEnabled=this.checked"> Rung khi thực hiện</label>';
  h+='<div class="slbl">QUỸ CHUNG</div>';
  h+='<label style="display:flex;gap:8px;margin-bottom:6px"><input type="checkbox" '+(S.potEnabled?'checked':'')+' onchange="togglePot(this.checked)"> Bật quỹ chung</label>';
  h+='<div class="ca"><input type="number" value="'+(S.pot/1000)+'" oninput="upPot(this.value)" min="0" step="0.5"><span>x 1.000d</span></div>';
  h+='<button class="sbt" onclick="saveState();clMoF();render()">Lưu</button></div></div>';
  $('modal-root').innerHTML=h;S.modal='__set__'
}

/* ===== OPEN / CLOSE MODALS ===== */
function openAct(i){S.ap=i;S.atab='send';S.aamt=0;S.atgt=[];S.modal='action';$('modal-root').innerHTML=rActModal()}
function openPotAct(){if(!S.potEnabled)return;openAct(-1)}
function openActQ(e,i,tab){e.stopPropagation();S.ap=i;S.atab=tab;S.aamt=0;var others=[];for(var j=0;j<S.players.length;j++){if(j!==i)others.push(j)}S.atgt=[];for(var j=0;j<others.length;j++)S.atgt.push(others[j]);S.modal='action';$('modal-root').innerHTML=rActModal();updTgt()}
function clMo(e){if(e.target.classList.contains('mo'))clMoF()}
function clMoF(){S.modal=null;$('modal-root').innerHTML=''}

/* ===== MISC ===== */
function incRound(){S.round++;render()}
function toggleSort(){S.sortDesc=!S.sortDesc;render()}
function copyResult(){
  var lines=['=== KẾT QUẢ HIỆN TẠI ==='];
  var sorted=[];for(var i=0;i<S.players.length;i++)sorted.push(i);
  sorted.sort(function(a,b){return S.players[b].balance-S.players[a].balance});
  for(var i=0;i<sorted.length;i++){var p=S.players[sorted[i]];var d=p.balance-p.initial;lines.push((i+1)+'. '+p.name+': '+ff(p.balance)+' ('+(d>=0?'+':'')+fmt(d)+')')}
  if(uhTab==='res'){var debts=calcDebts();lines.push('');lines.push('Thanh toán cuối trận:');for(var di=0;di<debts.length;di++)lines.push('- '+S.players[debts[di].from].name+' trả '+S.players[debts[di].to].name+' '+ff(debts[di].amount))}
  lines.push('');lines.push('Tổng: '+ff(totBal()+S.pot)+' | '+S.hist.length+' GD | Vòng '+S.round);
  var txt=lines.join('\n');
  function fb(){var ta=document.createElement('textarea');ta.value=txt;ta.style.cssText='position:fixed;opacity:0';document.body.appendChild(ta);ta.focus();ta.select();try{document.execCommand('copy');alert('Đã sao chép!')}catch(xe){alert(txt)}document.body.removeChild(ta)}
  try{if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(txt).then(function(){alert('Đã sao chép!')}).catch(fb);else fb()}catch(xe){fb()}}

/* ===== SETUP HELPERS ===== */
function setPC(n){while(S.players.length<n)S.players.push({name:'Người chơi '+(S.players.length+1),color:COLS[S.players.length%COLS.length],emoji:'',balance:DBAL,initial:DBAL});while(S.players.length>n)S.players.pop();render()}
function upName(i,v){S.players[i].name=v||('P'+(i+1))}
function upBal(i,v){var n=parseFloat(v)*1000;if(isNaN(n)||n<=0)n=1000;n=Math.round(n/500)*500;S.players[i].initial=n;S.players[i].balance=n;var t=$('totLbl');if(t)t.textContent=ff(totInit())}
function upQD(qi,v){var n=parseFloat(v)*1000;if(!isNaN(n)&&n>0)S.quickDenoms[qi]=Math.round(n/500)*500}
function togglePot(v){S.potEnabled=v;if(!v)S.pot=0;render()}
function upPot(v){var n=parseFloat(v)*1000;if(isNaN(n)||n<0)n=0;S.pot=Math.round(n/500)*500}
function resetDefaults(){for(var i=0;i<S.players.length;i++){S.players[i].name='Người chơi '+(i+1);S.players[i].color=COLS[i%COLS.length];S.players[i].emoji=''}render()}
function splitTotal(){var el=$('splitInp');var v=el?el.value:'';if(!v)return;var t=Math.round(parseFloat(v)*1000);if(isNaN(t)||t<=0)return;var each=Math.floor(t/S.players.length/500)*500;if(each<500)each=500;for(var i=0;i<S.players.length;i++){S.players[i].initial=each;S.players[i].balance=each}render()}
function toggleCompact(){S.compact=!S.compact;render()}
function setHistFilter(i){
  S.histFilter=i;
  var hlEl=document.querySelector('.hl');
  if(!hlEl){render();return}
  var html='';
  if(S.hist.length===0)html='<div class="hi" style="text-align:center;opacity:.4">Chưa có giao dịch</div>';
  else{var fr=S.hist.length-1;var shown=0;for(var j=fr;j>=0&&shown<50;j--){if(i>=0){var e=S.hist[j];if(e.f!==i&&e.t.indexOf(i)<0)continue}shown++;html+='<div class="hi"><span style="opacity:.4">'+S.hist[j].time+'</span> '+esc(S.hist[j].text)+'</div>'}}
  hlEl.innerHTML=html;
  saveState()
}
function setHistFilterFromSel(v){S.histFilter=parseInt(v,10);renderUhModal()}
function setUhTab(t){uhTab=t;renderUhModal()}
var pcPressTimer=null,pcPressInterval=null;
function adjustPC(dir){var n=S.players.length+dir;if(n<2||n>20)return;setPC(n)}
function pcPressStart(dir){adjustPC(dir);pcPressTimer=setTimeout(function(){pcPressInterval=setInterval(function(){adjustPC(dir)},100)},500)}
function pcPressEnd(){clearTimeout(pcPressTimer);clearInterval(pcPressInterval)}

/* AVATAR PICKER */
var pkFor=-1;
function pickAv(i){
  if(pkFor===i){pkFor=-1;var el=$('pkpnl');if(el)el.innerHTML='';return}
  pkFor=i;var p=S.players[i];
  var h='<div class="pkp"><div class="pk-lbl">Màu sắc</div>';
  h+='<div class="clrs">';
  for(var c=0;c<COLS.length;c++){var cl=COLS[c];h+='<div class="cpd'+(p.color===cl?' on':'')+'" style="background:'+cl+'" onclick="appClr(\''+cl+'\')"></div>'}
  h+='</div>';
  h+='<div class="pk-lbl">Emoji</div>';
  h+='<div class="emjs">';
  for(var e=0;e<EMOJIS.length;e++){var em=EMOJIS[e];h+='<div class="emj'+(p.emoji===em?' on':'')+'" onclick="appEmoji(\''+em+'\')">'+em+'</div>'}
  h+='</div>';
  if(p.emoji)h+='<div onclick="appEmoji(\'\')" style="font-size:11px;color:var(--dim);cursor:pointer;padding:2px 0">&#10005; Xóa emoji</div>';
  h+='</div>';
  var el=$('pkpnl');if(el)el.innerHTML=h}
function appClr(c){if(pkFor>=0){S.players[pkFor].color=c;pickAv(-1);pkFor=-1;render()}}
function appEmoji(em){if(pkFor>=0){S.players[pkFor].emoji=em;pickAv(-1);pkFor=-1;render()}}

function startG(){
  var seen={};
  for(var i=0;i<S.players.length;i++){
    var n=S.players[i].name.trim();
    if(!n){alert('Người chơi '+(i+1)+' chưa có tên!');return}
    if(seen[n]){alert('Tên bị trùng: '+n);return}
    seen[n]=1;S.players[i].name=n}
  S.phase='playing';S.hist=[];S.undoStack=[];S.round=1;S.hidePinned=false;if(S.autoTimerStart){resetTimer();startTimer()}else resetTimer();startTimerTick();render()}

render();
