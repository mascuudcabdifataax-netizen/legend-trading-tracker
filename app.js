

(() => {
const $ = id => document.getElementById(id);
const STORAGE_KEY = "legend-tracker-data-v1";
const CONFIG_KEY = "legend-tracker-supabase-config-v1";
const ACCOUNT_SIZES = [6000,15000,50000,100000];
let data = loadLocal();
let supabase = null, currentUser = null, syncMode = false, cloudReady = false, toastTimer;
function defaultData(){return {trades:[],payouts:[],stages:{"6000":"challenge","15000":"planned","50000":"planned","100000":"planned"},settings:{activeAccount:6000,activeStage:"challenge"}}}
function loadLocal(){try{return {...defaultData(),...JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}")}}catch{return defaultData()}}
function saveLocal(){localStorage.setItem(STORAGE_KEY,JSON.stringify(data))}
function uuid(){return crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(16).slice(2)}`}
function money(n){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(Number(n)||0)}
function dateNow(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2800)}
function tradeR(trade){
  if(trade.outcome==="TP") return 3;
  if(trade.outcome==="SL") return -1;
  if(trade.outcome==="BE") return 0;
  return Number(trade.rMultiple ?? 0);
}

function getBalance(account,stage){
  return sortedTrades()
    .filter(t=>Number(t.account)===Number(account)&&t.stage===stage)
    .reduce((balance,t)=>{
      const risk=Number(t.riskAmount)||Number(t.account)*riskRate(stage);
      return balance+(t.profitLoss!=null
        ? Number(t.profitLoss)
        : risk*tradeR(t));
    },Number(account));
}

  
function cycleNum(index){return Math.floor(index/8)+1}
function outcomeLabel(o){return o==="TP"?"TP":o==="SL"?"SL":"BE"}
function sortedTrades(){return [...data.trades].sort((a,b)=>a.date.localeCompare(b.date)||a.createdAt-b.createdAt)}function updateRiskPreview(){
  const account=Number($("tradeAccount").value);
  const stage=$("tradeStage").value;
  const balance=getBalance(account,stage);
  const amount=balance*riskRate(stage);
  $("riskPreview").textContent=
    `Balance: ${money(balance)} | Risk: ${money(amount)} (${(riskRate(stage)*100).toFixed(1)}%). Daily limit: 2 trades.`;
}
function setActiveTab(tab){document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));["dashboard","journal","accounts"].forEach(id=>$(id).classList.toggle("hidden",id!==tab));if(tab==="journal")renderJournal();if(tab==="accounts")renderPayouts()}
function render(){
const trades=sortedTrades(), wins=trades.filter(t=>t.outcome==="TP").length, counted=trades.filter(t=>t.outcome!=="BE").length, ruleYes=trades.filter(t=>t.rules==="yes").length, payout=data.payouts.reduce((s,p)=>s+Number(p.amount),0), account=Number(data.settings.activeAccount||6000),stage=data.settings.activeStage||"challenge";
$("metricAccount").textContent=money(account);$("metricStage").textContent=`${stage[0].toUpperCase()+stage.slice(1)} · ${(riskRate(stage)*100).toFixed(1)}% risk`;
$("riskRule").textContent=`${(riskRate(stage)*100).toFixed(1)}% = ${money(account*riskRate(stage))} guide per trade`;
const cycleCount=trades.length%8;$("metricCycle").textContent=`${cycleCount===0&&trades.length>0?8:cycleCount} / 8`;$("metricCycleSub").textContent=trades.length?`${Math.floor((trades.length-1)/8)+1} cycle(s) in log`:"8-trade review unit";
$("metricWinRate").textContent=counted?`${Math.round(wins/counted*100)}%`:"—";$("metricTrades").textContent=`${trades.length} trades logged`;$("metricRules").textContent=trades.length?`${Math.round(ruleYes/trades.length*100)}%`:"—";
$("goalAmount").innerHTML=`${money(payout)} <small>/ $10,000</small>`;$("goalProgress").style.width=`${Math.min(100,payout/10000*100)}%`;$("goalPercent").textContent=`${Math.min(100,payout/10000*100).toFixed(1)}% completed`;
const latest=trades.slice(-4).reverse();$("latestTrades").innerHTML=latest.length?latest.map(t=>`<div class="trade-mini"><div><b>${escapeHtml(t.pair)} · ${outcomeLabel(t.outcome)}</b><small>${escapeHtml(t.date)} · Cycle ${t.cycle}</small></div><span class="outcome ${t.outcome}">${t.outcome}</span></div>`).join(""):'<div class="empty">Trade-gaaga koowaad halkan ayuu ka muuqan doonaa.</div>';
const complete=trades.length>=8&&trades.length%8===0, cycleTrades=trades.slice(Math.floor((trades.length-1)/8)*8);
if(complete){const ct=trades.slice(-8),tp=ct.filter(t=>t.outcome==="TP").length,sl=ct.filter(t=>t.outcome==="SL").length,be=ct.filter(t=>t.outcome==="BE").length,followed=ct.filter(t=>t.rules==="yes").length;$("cycleReview").classList.remove("hidden");$("cycleReview").innerHTML=`<div class="section-head"><div><p class="eyebrow">CYCLE COMPLETE</p><h3>Cycle ${Math.ceil(trades.length/8)} — execution review</h3><p class="muted">Qiimee habka aad u raacday; 8 trades keliya ma caddaynayaan edge muddo dheer.</p></div><span class="outcome TP">8 / 8 TRADES</span></div><div class="cycle-stats"><div><small>TP / Wins</small><b>${tp}</b></div><div><small>SL / Losses</small><b>${sl}</b></div><div><small>Break-even</small><b>${be}</b></div><div><small>Rules followed</small><b>${followed}/8</b></div></div>`}else{$("cycleReview").classList.add("hidden")}
renderJournal();renderPayouts();renderAccountStages();
}
function renderJournal(){const trades=sortedTrades();$("tradeRows").innerHTML=trades.slice().reverse().map((t,i)=>`<tr><td>${trades.length-i}</td><td>${escapeHtml(t.date)}</td><td>${t.cycle}</td><td>${money(t.account)}<br><small>${escapeHtml(t.stage)}</small></td><td>${escapeHtml(t.pair)}${t.setup?`<br><small>${escapeHtml(t.setup)}</small>`:""}</td><td><span class="outcome ${t.outcome}">${t.outcome}</span></td><td>${t.rules==="yes"?"✓ Yes":"✕ No"}</td><td>${t.psychology}/10</td><td>${money(t.riskAmount)} (${t.riskPercent}%)</td><td><button class="delete-btn" data-delete-trade="${t.id}" aria-label="Delete trade">×</button></td></tr>`).join("");$("journalEmpty").classList.toggle("hidden",trades.length>0)}
function renderAccountStages(){document.querySelectorAll("[data-account-stage]").forEach(s=>s.value=data.stages[s.dataset.accountStage]||"planned")}
function renderPayouts(){const payouts=[...data.payouts].sort((a,b)=>b.date.localeCompare(a.date));$("payoutRows").innerHTML=payouts.length?payouts.map(p=>`<div class="payout-row"><div><b>${money(p.amount)}</b><small>${escapeHtml(p.date)} · ${money(p.account)} account</small></div><button class="delete-btn" data-delete-payout="${p.id}" aria-label="Delete payout">×</button></div>`).join(""):'<div class="empty">Weli payout lama gelin.</div>'}
function openTradeForm(){$("tradeDate").value=dateNow();$("tradeStage").value=data.settings.activeStage||"challenge";$("tradeAccount").value=String(data.settings.activeAccount||6000);$("tradeForm").classList.remove("hidden");updateRiskPreview();setActiveTab("journal");$("tradeForm").scrollIntoView({behavior:"smooth",block:"start"})}
function closeTradeForm(){$("tradeForm").classList.add("hidden")}
function setConnectionBadge(){const b=$("connectionBadge");b.textContent=syncMode&&currentUser?"Cloud synced":syncMode?"Cloud configured":"Local mode";b.classList.toggle("cloud",syncMode&&!!currentUser)}
async function cloudUpsert(table,rows){if(!syncMode||!currentUser||!rows.length)return;const payload=rows.map(r=>({...r,user_id:currentUser.id}));const {error}=await supabase.from(table).upsert(payload,{onConflict:"id"});if(error)throw error}
async function cloudDelete(table,id){if(!syncMode||!currentUser)return;const {error}=await supabase.from(table).delete().eq("id",id).eq("user_id",currentUser.id);if(error)throw error}
async function syncAll(){if(!syncMode||!currentUser)return;try{const [tr,pay,acc]=await Promise.all([supabase.from("legend_trades").select("*").eq("user_id",currentUser.id),supabase.from("legend_payouts").select("*").eq("user_id",currentUser.id),supabase.from("legend_account_stages").select("*").eq("user_id",currentUser.id)]);if(tr.error)throw tr.error;if(pay.error)throw pay.error;if(acc.error)throw acc.error;data.trades=(tr.data||[]).map(r=>({id:r.id,date:r.date,stage:r.stage,account:Number(r.account_size),pair:r.pair,setup:r.setup||"",outcome:r.outcome,rules:r.rules_followed,psychology:r.psychology,lesson:r.lesson||"",riskAmount:Number(r.risk_amount),riskPercent:Number(r.risk_percent).toFixed(1),cycle:r.cycle,createdAt:Number(r.created_at_ms||Date.now())}));data.payouts=(pay.data||[]).map(r=>({id:r.id,date:r.date,amount:Number(r.amount),account:Number(r.account_size)}));(acc.data||[]).forEach(a=>data.stages[String(a.account_size)]=a.stage);saveLocal();render();toast("Cloud data loaded.");}catch(e){console.error(e);toast("Cloud sync error: "+(e.message||"check setup"));}}
function makeSupabaseRecord(t){return {id:t.id,date:t.date,stage:t.stage,account_size:t.account,pair:t.pair,setup:t.setup,outcome:t.outcome,rules_followed:t.rules,psychology:t.psychology,lesson:t.lesson,risk_amount:t.riskAmount,risk_percent:t.riskPercent,cycle:t.cycle,created_at_ms:t.createdAt}}
async function setupCloud(){const cfg=JSON.parse(localStorage.getItem(CONFIG_KEY)||"null");if(!cfg?.url||!cfg?.key||!window.supabase?.createClient){syncMode=false;setConnectionBadge();return}try{supabase=window.supabase.createClient(cfg.url,cfg.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});syncMode=true;const {data:sessionData}=await supabase.auth.getSession();currentUser=sessionData.session?.user||null;setConnectionBadge();if(currentUser)await syncAll();supabase.auth.onAuthStateChange((_event,session)=>{currentUser=session?.user||null;setConnectionBadge();if(currentUser)setTimeout(syncAll,0)});}catch(e){console.error(e);syncMode=false;setConnectionBadge()}}
function saveConfig(){const url=$("supabaseUrl").value.trim().replace(/\/$/,""),key=$("supabaseKey").value.trim();if(!url||!key){toast("Geli Supabase URL iyo public anon key.");return}try{new URL(url)}catch{toast("Project URL sax ah geli.");return}localStorage.setItem(CONFIG_KEY,JSON.stringify({url,key}));toast("Configuration saved. Sign in to sync.");setupCloud()}
async function auth(signUp){if(!supabase){toast("Marka hore geli oo kaydi Supabase config.");return}const email=$("authEmail").value.trim(),password=$("authPassword").value;if(!email||password.length<8){toast("Email geli; password-kuna ha ahaado ugu yaraan 8 xaraf.");return}const result=signUp?await supabase.auth.signUp({email,password}):await supabase.auth.signInWithPassword({email,password});if(result.error){toast(result.error.message);return}currentUser=result.data.user;setConnectionBadge();if(signUp&&!result.data.session){toast("Account la sameeyay. Hubi email-kaaga haddii verification la dalbado.");return}await syncAll();$("settingsDialog").close();toast(signUp?"Account created.":"Signed in. Cloud sync ready.")}
async function main(){
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>setActiveTab(b.dataset.tab)));document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>setActiveTab(b.dataset.goto)));
$("newTrade").addEventListener("click",openTradeForm);$("newTradeTop").addEventListener("click",openTradeForm);$("closeForm").addEventListener("click",closeTradeForm);$("cancelForm").addEventListener("click",closeTradeForm);
$("tradeStage").addEventListener("change",updateRiskPreview);$("tradeAccount").addEventListener("change",updateRiskPreview);

$("tradeForm").addEventListener("submit",async e=>{
e.preventDefault();

const date=$("tradeDate").value;
const stage=$("tradeStage").value;
const account=Number($("tradeAccount").value);
const outcome=$("outcome").value;

const dayCount=data.trades.filter(t=>
t.date===date &&
Number(t.account)===account &&
t.stage===stage
).length;

if(dayCount>=2){
toast("Daily limit reached: ugu badnaan 2 trades maalintii.");
return;
}

const balance=getBalance(account,stage);
const rate=riskRate(stage);
const riskAmount=balance*rate;

let rMultiple=0;

if(outcome==="TP") rMultiple=3;
else if(outcome==="SL") rMultiple=-1;
else if(outcome==="BE") rMultiple=0;
else {
const manual=$("manualR").value;
if(manual.trim()===""){
toast("Geli R multiple-ka.");
return;
}
rMultiple=Number(manual);
if(!Number.isFinite(rMultiple)){
toast("R multiple sax ah geli.");
return;
}
}

const trades=sortedTrades();
const t={
id:uuid(),
date,
stage,
account,
pair:$("pair").value.trim().toUpperCase(),
setup:$("setup").value.trim(),
outcome,
rMultiple,
profitLoss:riskAmount*rMultiple,
rules:$("rules").value,
psychology:Number($("psychology").value),
lesson:$("lesson").value.trim(),
riskAmount,
riskPercent:(rate*100).toFixed(1),
cycle:cycleNum(trades.filter(x=>
Number(x.account)===account && x.stage===stage
).length),
createdAt:Date.now()
};

if(!t.pair){
toast("Instrument-ka geli.");
return;
}

data.trades.push(t);
data.settings.activeAccount=account;
data.settings.activeStage=stage;
saveLocal();
render();
closeTradeForm();
e.target.reset();
$("pair").value="GBPUSD";
$("psychology").value="7";
if($("manualR")) $("manualR").value="0";
updateRiskPreview();

try{
await cloudUpsert("legend_trades",[makeSupabaseRecord(t)]);
toast("Trade saved"+(syncMode&&currentUser?" & synced.":" locally."));
}catch(err){
toast("Saved locally; cloud sync failed: "+err.message);
}
});
,stage=$("tradeStage").value,account=Number($("tradeAccount").value);const dayCount=data.trades.filter(t=>t.date===date).length;if(dayCount>=2){toast("Daily limit reached: ugu badnaan 2 trades maalintii.");return}const trades=sortedTrades(),rate=riskRate(stage),t={id:uuid(),date,stage,account,pair:$("pair").value.trim().toUpperCase(),setup:$("setup").value.trim(),outcome:$("outcome").value,rules:$("rules").value,psychology:Number($("psychology").value),lesson:$("lesson").value.trim(),riskAmount:account*rate,riskPercent:(rate*100).toFixed(1),cycle:cycleNum(trades.length),createdAt:Date.now()};if(!t.pair){toast("Instrument-ka geli.");return}data.trades.push(t);data.settings.activeAccount=account;data.settings.activeStage=stage;saveLocal();render();closeTradeForm();e.target.reset();$("pair").value="XAUUSD";$("psychology").value="7";try{await cloudUpsert("legend_trades",[makeSupabaseRecord(t)]);toast("Trade saved"+(syncMode&&currentUser?" & synced.":" locally."))}catch(err){toast("Saved locally; cloud sync failed: "+err.message)}});
document.body.addEventListener("click",async e=>{const td=e.target.closest("[data-delete-trade]");if(td&&confirm("Ma tirtiraysaa trade-kan?")){const id=td.dataset.deleteTrade;data.trades=data.trades.filter(t=>t.id!==id);saveLocal();render();try{await cloudDelete("legend_trades",id)}catch(err){toast("Deleted locally; cloud sync failed.")}return}const pd=e.target.closest("[data-delete-payout]");if(pd&&confirm("Ma tirtiraysaa payout-kan?")){const id=pd.dataset.deletePayout;data.payouts=data.payouts.filter(p=>p.id!==id);saveLocal();render();try{await cloudDelete("legend_payouts",id)}catch(err){toast("Deleted locally; cloud sync failed.")}}});
document.querySelectorAll("[data-account-stage]").forEach(s=>s.addEventListener("change",async()=>{const size=Number(s.dataset.accountStage);data.stages[String(size)]=s.value;saveLocal();if(size===6000){data.settings.activeAccount=6000;data.settings.activeStage=s.value==="planned"?"challenge":s.value}render();try{await cloudUpsert("legend_account_stages",[{id:`stage-${size}`,account_size:size,stage:s.value}])}catch(err){toast("Stage saved locally; cloud sync failed.")}}));
$("payoutDate").value=dateNow();$("payoutForm").addEventListener("submit",async e=>{e.preventDefault();const p={id:uuid(),date:$("payoutDate").value,amount:Number($("payoutAmount").value),account:Number($("payoutAccount").value)};if(!(p.amount>0)){toast("Amount sax ah geli.");return}data.payouts.push(p);saveLocal();render();$("payoutAmount").value="";try{await cloudUpsert("legend_payouts",[{id:p.id,date:p.date,amount:p.amount,account_size:p.account}]);toast("Payout saved"+(syncMode&&currentUser?" & synced.":" locally."))}catch(err){toast("Payout saved locally; cloud sync failed.")}});
$("settingsBtn").addEventListener("click",()=>{const cfg=JSON.parse(localStorage.getItem(CONFIG_KEY)||"null");$("supabaseUrl").value=cfg?.url||"";$("supabaseKey").value=cfg?.key||"";$("settingsDialog").showModal()});$("saveCloudConfig").addEventListener("click",saveConfig);$("signUpBtn").addEventListener("click",()=>auth(true));$("signInBtn").addEventListener("click",()=>auth(false));$("signOutBtn").addEventListener("click",async()=>{if(supabase)await supabase.auth.signOut();currentUser=null;setConnectionBadge();toast("Signed out. This device's local copy remains.");});
render();await setupCloud();if("serviceWorker" in navigator && location.protocol.startsWith("http"))navigator.serviceWorker.register("./service-worker.js").catch(console.warn);
}
main();
})();
