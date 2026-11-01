'use strict';
const $ = id => document.getElementById(id);
const faces = {1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
const maxRounds=5;
let state={difficulty:'medium',round:1,playerScore:0,cpuScore:0,playerDice:[0,0,0,0,0],cpuDice:[0,0,0,0,0],kept:[false,false,false,false,false],rolls:0,phase:'start',busy:false,session:0};
const rand=()=>1+Math.floor(Math.random()*6);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function dieNode(value,opts={}){
 const button=document.createElement(opts.selectable?'button':'div');
 button.className='die'+(opts.kept?' keep':'')+(opts.selectable?' selectable':'')+(!value?' placeholder':'');
 if(opts.selectable){button.type='button';button.setAttribute('aria-pressed',String(!!opts.kept));button.setAttribute('aria-label',`Würfel ${opts.index+1}: ${value}${opts.kept?', behalten':''}`);button.addEventListener('click',()=>toggleKeep(opts.index));}
 else button.setAttribute('aria-label',value?`Würfel ${value}`:'Noch nicht gewürfelt');
 for(let p=0;p<9;p++){const cell=document.createElement('span');if((faces[value]||[]).includes(p))cell.className='pip';button.append(cell)}
 return button;
}
function renderDice(id,dice,selectable=false){const el=$(id);el.replaceChildren(...dice.map((v,i)=>dieNode(v,{index:i,kept:selectable&&state.kept[i],selectable:selectable&&v>0&&state.phase==='player'&&!state.busy&&state.rolls>0&&state.rolls<3})));}
function evaluate(dice){
 const count=Array(7).fill(0);dice.forEach(v=>count[v]++);
 const groups=Array.from({length:6},(_,i)=>({v:i+1,n:count[i+1]})).sort((a,b)=>b.n-a.n||b.v-a.v);
 const nums=dice.slice().sort((a,b)=>b-a);
 const freq=groups.map(x=>x.n);
 if(freq[0]===5)return {rank:9,name:'Fünfling',tie:[groups[0].v]};
 if(freq[0]===4)return {rank:8,name:'Vierling',tie:[groups[0].v,groups[1].v]};
 if(freq[0]===3&&freq[1]===2)return {rank:7,name:'Full House',tie:[groups[0].v,groups[1].v]};
 if(dice.slice().sort().join('')==='23456')return {rank:6,name:'Große Straße',tie:[6]};
 if(dice.slice().sort().join('')==='12345')return {rank:5,name:'Kleine Straße',tie:[5]};
 if(freq[0]===3)return {rank:4,name:'Drilling',tie:[groups[0].v,...groups.slice(1).map(g=>g.v)]};
 if(freq[0]===2&&freq[1]===2)return {rank:3,name:'Zwei Paare',tie:[Math.max(groups[0].v,groups[1].v),Math.min(groups[0].v,groups[1].v),groups[2].v]};
 if(freq[0]===2)return {rank:2,name:'Ein Paar',tie:[groups[0].v,...groups.slice(1).map(g=>g.v)]};
 return {rank:1,name:'Höchster Würfel',tie:nums};
}
function compare(a,b){const x=evaluate(a),y=evaluate(b);if(x.rank!==y.rank)return Math.sign(x.rank-y.rank);for(let i=0;i<Math.max(x.tie.length,y.tie.length);i++){if((x.tie[i]||0)!==(y.tie[i]||0))return Math.sign((x.tie[i]||0)-(y.tie[i]||0));}return 0;}
function score(d){const e=evaluate(d);return e.rank*1000000+e.tie.reduce((sum,v,i)=>sum+v*Math.pow(7,4-i),0);}
function update(){
 $('playerScore').textContent=state.playerScore;$('cpuScore').textContent=state.cpuScore;
 $('roundLabel').textContent=`RUNDE ${state.round} / ${maxRounds}`;
 $('rollsLeft').textContent=`${3-state.rolls} ${3-state.rolls===1?'Wurf':'Würfe'} übrig`;
 $('rollButton').disabled=state.phase!=='player'||state.busy||state.rolls===3;
 $('standButton').disabled=state.phase!=='player'||state.busy||state.rolls===0;
 $('turnLabel').textContent=state.phase==='player'?'Dein Zug':state.phase==='cpu'?'Computer ist dran':'Runde beendet';
 $('playerHand').textContent=state.rolls?evaluate(state.playerDice).name:'Bereit zum Würfeln';
 renderDice('playerDice',state.playerDice,true);renderDice('cpuDice',state.cpuDice);
}
function toggleKeep(i){if(state.phase!=='player'||state.busy||state.rolls===0||state.rolls>=3)return;state.kept[i]=!state.kept[i];$('instruction').textContent='Markierte Würfel bleiben liegen. Würfle erneut oder beende deinen Zug.';update();}
async function animateRoll(id,oldValues,newValues,indices){
 const el=$(id);const duration=650;const tick=70;
 for(let t=0;t<duration;t+=tick){const d=oldValues.map((v,i)=>indices.includes(i)?rand():v);el.replaceChildren(...d.map(v=>dieNode(v)));el.querySelectorAll('.die').forEach((x,i)=>{if(indices.includes(i))x.classList.add('rolling')});await wait(tick)}
 el.replaceChildren(...newValues.map(v=>dieNode(v)));
}
async function playerRoll(){if(state.phase!=='player'||state.busy||state.rolls>=3)return;state.busy=true;const token=state.session;
 const indices=state.playerDice.map((_,i)=>i).filter(i=>state.rolls===0||!state.kept[i]);
 const prev=state.playerDice.slice();const next=prev.map((v,i)=>indices.includes(i)?rand():v);
 $('rollButton').disabled=true;$('standButton').disabled=true;
 await animateRoll('playerDice',prev,next,indices);if(token!==state.session)return;
 state.playerDice=next;state.rolls++;state.busy=false;
 $('playerStatus').textContent=`${state.rolls} von 3 Würfen gemacht`;
 $('instruction').textContent=state.rolls===3?'Alle Würfe verwendet. Beende deinen Zug.':'Klicke auf Würfel, die du behalten möchtest.';
 update();if(state.rolls===3)await wait(250).then(()=>{if(token===state.session)endPlayerTurn()});
}
function holdMedium(dice){
 const count=Array(7).fill(0);dice.forEach(v=>count[v]++);
 let best=6;for(let v=1;v<=6;v++)if(count[v]>count[best]||(count[v]===count[best]&&v>best))best=v;
 if(count[best]>=2)return dice.map(v=>v===best);
 const a=dice.filter(v=>v>=2&&v<=6),b=dice.filter(v=>v>=1&&v<=5);
 if(new Set(a).size>=4)return dice.map(v=>v>=2&&v<=6);
 if(new Set(b).size>=4)return dice.map(v=>v>=1&&v<=5);
 return dice.map(v=>v===Math.max(...dice));
}
function chooseHard(dice,rollsRemaining){
 // Search all possible kept subsets with a randomized, reproducible-size rollout.
 let bestMask=0,bestExpected=-Infinity;
 for(let mask=0;mask<32;mask++){
  const free=[];for(let i=0;i<5;i++)if(!(mask&(1<<i)))free.push(i);
  let total=0;const trials=100;
  for(let j=0;j<trials;j++){
   const trial=dice.slice();free.forEach(i=>trial[i]=rand());
   if(rollsRemaining>1){const keep=holdMedium(trial);trial.forEach((_,i)=>{if(!keep[i])trial[i]=rand()});}
   total+=score(trial);
  }
  const expected=total/trials;if(expected>bestExpected){bestExpected=expected;bestMask=mask;}
 }
 return dice.map((_,i)=>!!(bestMask&(1<<i)));
}
function cpuHold(dice,remaining){
 if(state.difficulty==='easy'){const picked=dice[Math.floor(Math.random()*5)];return dice.map(v=>v===picked&&Math.random()>.25)}
 if(state.difficulty==='medium')return holdMedium(dice);
 return chooseHard(dice,remaining);
}
async function endPlayerTurn(){if(state.phase!=='player'||state.busy||state.rolls===0)return;
 state.phase='cpu';state.busy=true;state.kept=[false,false,false,false,false];$('instruction').textContent='Der Computer würfelt …';$('cpuStatus').textContent='Würfelt …';update();
 const token=state.session;let dice=[0,0,0,0,0];let keep=[false,false,false,false,false];
 for(let roll=0;roll<3;roll++){
  if(token!==state.session)return;
  await wait(320);if(token!==state.session)return;
  const indices=dice.map((_,i)=>i).filter(i=>!keep[i]);
  if(!indices.length)break;
  const next=dice.map((v,i)=>indices.includes(i)?rand():v);
  await animateRoll('cpuDice',dice,next,indices);if(token!==state.session)return;
  dice=next;state.cpuDice=dice.slice();$('cpuStatus').textContent=`${roll+1} von 3 Würfen gemacht`;update();
  if(roll<2)keep=cpuHold(dice,2-roll);
 }
 if(token!==state.session)return;
 state.busy=false;state.phase='result';update();$('cpuHand').textContent=evaluate(dice).name;
 const cmp=compare(state.playerDice,dice);if(cmp>0)state.playerScore++;if(cmp<0)state.cpuScore++;
 update();
 $('resultTitle').textContent=cmp>0?'Du gewinnst die Runde!':cmp<0?'Der Computer gewinnt!':'Unentschieden!';
 $('resultText').textContent=`Du: ${evaluate(state.playerDice).name} · Computer: ${evaluate(dice).name}`;
 $('continueButton').textContent=state.round===maxRounds?'Ergebnis ansehen':'Nächste Runde →';
 $('roundResult').classList.remove('hidden');$('instruction').textContent='Die Runde ist beendet.';
}
function nextRound(){if(state.phase!=='result')return;
 if(state.round===maxRounds){
  const result=state.playerScore>state.cpuScore?'Du hast das Spiel gewonnen!':state.playerScore<state.cpuScore?'Der Computer hat das Spiel gewonnen.':'Das Spiel endet unentschieden.';
  $('resultTitle').textContent=result;$('resultText').textContent=`Endstand: Du ${state.playerScore} : ${state.cpuScore} Computer`;
  $('continueButton').textContent='Nochmal spielen';state.phase='finished';return;
 }
 state.round++;state.playerDice=[0,0,0,0,0];state.cpuDice=[0,0,0,0,0];state.kept=[false,false,false,false,false];state.rolls=0;state.phase='player';state.busy=false;
 $('roundResult').classList.add('hidden');$('cpuStatus').textContent='Wartet auf seinen Zug';$('playerStatus').textContent='Würfle, um zu beginnen';$('cpuHand').textContent='Noch kein Wurf';$('instruction').textContent='Drücke „Würfeln“, um deinen ersten Wurf zu machen.';update();
}
function startGame(){const difficulty=document.querySelector('input[name="difficulty"]:checked').value;const session=state.session+1;
 state={difficulty,round:1,playerScore:0,cpuScore:0,playerDice:[0,0,0,0,0],cpuDice:[0,0,0,0,0],kept:[false,false,false,false,false],rolls:0,phase:'player',busy:false,session};
 $('startScreen').classList.add('hidden');$('gameScreen').classList.remove('hidden');$('roundResult').classList.add('hidden');$('cpuStatus').textContent='Wartet auf seinen Zug';$('cpuHand').textContent='Noch kein Wurf';$('playerStatus').textContent='Würfle, um zu beginnen';$('instruction').textContent='Drücke „Würfeln“, um deinen ersten Wurf zu machen.';update();
}
function backToStart(){state.session++;state.phase='start';$('gameScreen').classList.add('hidden');$('startScreen').classList.remove('hidden');}
function showRules(){const dialog=$('rulesDialog');if(!dialog.open)dialog.showModal()}
$('rulesTop').addEventListener('click',showRules);$('rulesStart').addEventListener('click',showRules);$('closeRules').addEventListener('click',()=>$('rulesDialog').close());
$('rulesDialog').addEventListener('click',e=>{if(e.target===$('rulesDialog'))$('rulesDialog').close()});
$('startButton').addEventListener('click',startGame);$('rollButton').addEventListener('click',playerRoll);$('standButton').addEventListener('click',endPlayerTurn);$('restartButton').addEventListener('click',backToStart);
$('continueButton').addEventListener('click',()=>{if(state.phase==='finished')startGame();else nextRound()});
