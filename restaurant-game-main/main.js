const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ingredientTypes = ['Bun','Patty','Cheese','Lettuce','Tomato'];
const ingredientColors = {
  Bun: '#F4A460',
  Patty: '#8B4513',
  Cheese: '#FFD700',
  Lettuce: '#32CD32',
  Tomato: '#FF6347'
};
const ingredientsPool = [];
let movingIngredients = [];

class Ingredient {
  constructor(type, x, y) {
    this.type = type;
    this.width = 40;
    this.height = 20;
    this.x = x;
    this.y = y;
    this.color = ingredientColors[type];
    this.state = 'idle';
    this.targetX = 0;
    this.targetY = 0;
    this.associatedNPC = null;
    this.orderIndex = null;
  }
  update() {
    if (this.state === 'moving') {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const dist = Math.hypot(dx, dy);
      const speed = 4;
      if (dist < speed) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.state = 'placed';
      } else {
        this.x += (dx/dist)*speed;
        this.y += (dy/dist)*speed;
      }
    }
  }
  draw() {
    switch (this.type) {
      case 'Bun':
        ctx.fillStyle = ingredientColors.Bun;
        ctx.beginPath();
        const cx = this.x + this.width/2;
        const cy = this.y + this.height/2;
        const r = this.width/2;
        if (this.associatedNPC) {
          if (this.orderIndex === 0) {
            // top bun semicircle
            ctx.arc(cx, cy, r, Math.PI, 0, false);
          } else {
            // bottom bun semicircle
            ctx.arc(cx, cy, r, 0, Math.PI, false);
          }
        } else {
          // pool bun default as top bun
          ctx.arc(cx, cy, r, Math.PI, 0, false);
        }
        ctx.fill();
        break;
      case 'Patty':
        ctx.fillStyle = ingredientColors.Patty;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        break;
      case 'Cheese':
        ctx.fillStyle = ingredientColors.Cheese;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.width, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        break;
      case 'Lettuce':
        ctx.fillStyle = ingredientColors.Lettuce;
        ctx.beginPath();
        const wave = 3;
        const wW = this.width / wave;
        ctx.moveTo(this.x, this.y + this.height);
        for (let i = 0; i <= wave; i++) {
          ctx.quadraticCurveTo(
            this.x + wW*(i-0.5), this.y + this.height - 10,
            this.x + wW*i, this.y + this.height
          );
        }
        ctx.lineTo(this.x + this.width, this.y);
        ctx.lineTo(this.x, this.y);
        ctx.closePath();
        ctx.fill();
        break;
      case 'Tomato':
        ctx.fillStyle = ingredientColors.Tomato;
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI*2);
        ctx.fill();
        // seeds
        ctx.fillStyle = 'white';
        for (let s = -1; s <= 1; s += 2) {
          ctx.beginPath();
          ctx.arc(
            this.x + this.width/2 + s*this.width/6,
            this.y + this.height/2,
            this.width/10, 0, Math.PI*2
          );
          ctx.fill();
        }
        break;
      default:
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }
}

function initIngredients() {
  ingredientsPool.length = 0;
  const count = ingredientTypes.length;
  const ingW = 40, spacing = 20;
  const totalW = count * ingW + (count - 1) * spacing;
  const startX = (canvas.width - totalW) / 2;
  const y = canvas.height - ingW - 10;
  for (let i = 0; i < count; i++) {
    const type = ingredientTypes[i];
    const x = startX + i * (ingW + spacing);
    ingredientsPool.push(new Ingredient(type, x, y));
  }
}

function generateBurgerOrder() {
  const midTypes = ['Patty','Cheese','Lettuce','Tomato'];
  const count = Math.floor(Math.random()*3) + 1;
  const mids = [];
  for (let i = 0; i < count; i++) mids.push(midTypes[Math.floor(Math.random()*midTypes.length)]);
  return ['Bun', ...mids, 'Bun'];
}

initIngredients();

const npcs = [];
const spawnInterval = 3000;
let lastSpawn = Date.now();
let score = 0;

class NPC {
  constructor() {
    this.width = 80;
    this.height = 120;
    this.x = canvas.width + this.width;
    this.y = canvas.height/2 - this.height/2;
    this.speed = 2;
    this.order = generateBurgerOrder();
    this.difficulty = this.order.length > 4 ? 'hard' : 'easy';
    this.state = 'walking';
    this.faceExpression = 'neutral';
    this.assembledCount = 0;
  }
  update() {
    if (this.state === 'leaving') { this.x += this.speed; return; }
    const tableX = canvas.width/2 - this.width/2;
    const spacing = this.width*4;
    const queueList = npcs.filter(n=>n.state!=='leaving');
    const idx = queueList.indexOf(this);
    const targetX = tableX + idx*spacing;
    const dx = targetX - this.x;
    if (Math.abs(dx) > this.speed) {
      this.x += Math.sign(dx) * this.speed;
    } else {
      this.x = targetX;
    }
    if (this.x === targetX) {
      this.state = idx === 0 ? 'waiting' : 'queued';
    }
  }
  draw() {
    // draw larger character for NPC
    // head
    ctx.fillStyle = '#FFDAB9';
    ctx.beginPath();
    ctx.arc(this.x + this.width/2, this.y + 25, 25, 0, Math.PI*2);
    ctx.fill();
    // chef hat for hard NPCs
    if (this.difficulty === 'hard') {
      const bandW = 50, bandH = 12;
      const bandX = this.x + this.width/2 - bandW/2;
      const bandY = this.y - bandH;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(bandX, bandY, bandW, bandH);
      ctx.beginPath();
      ctx.arc(this.x + this.width/2, bandY, bandW/2, Math.PI, 0);
      ctx.fill();
    }
    // draw face based on expression
    ctx.strokeStyle = 'black'; ctx.lineWidth = 2;
    const headX = this.x + this.width/2;
    const headY = this.y + 25;
    // eyes
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(headX - 10, headY - 5, 4, 0, 2*Math.PI);
    ctx.arc(headX + 10, headY - 5, 4, 0, 2*Math.PI);
    ctx.fill();
    // mouth
    ctx.beginPath();
    if (this.faceExpression === 'happy') {
      ctx.arc(headX, headY + 10, 10, 0, Math.PI);
    } else if (this.faceExpression === 'sad') {
      ctx.arc(headX, headY + 15, 10, Math.PI, 2*Math.PI);
    } else {
      ctx.moveTo(headX - 10, headY + 10);
      ctx.lineTo(headX + 10, headY + 10);
    }
    ctx.stroke();
    // body
    ctx.fillStyle = 'blue';
    ctx.fillRect(this.x + this.width/2 - 20, this.y + 50, 40, 60);
    // arms
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.x + this.width/2 - 20, this.y + 70);
    ctx.lineTo(this.x + this.width/2 - 60, this.y + 110);
    ctx.moveTo(this.x + this.width/2 + 20, this.y + 70);
    ctx.lineTo(this.x + this.width/2 + 60, this.y + 110);
    ctx.stroke();
    // legs
    ctx.beginPath();
    ctx.moveTo(this.x + this.width/2 - 10, this.y + 110);
    ctx.lineTo(this.x + this.width/2 - 10, this.y + 160);
    ctx.moveTo(this.x + this.width/2 + 10, this.y + 110);
    ctx.lineTo(this.x + this.width/2 + 10, this.y + 160);
    ctx.stroke();
    if (this.state === 'waiting') {
      ctx.fillStyle = 'black';
      ctx.font = '18px Arial';
      ctx.fillText(this.order.join(' + '), this.x+5, this.y-10);
    }
  }
}

function spawnNPC() { npcs.push(new NPC()); }

function update() {
  const now = Date.now();
  if (now - lastSpawn > spawnInterval) {
    spawnNPC(); lastSpawn = now;
  }
  for (let i = npcs.length - 1; i >= 0; i--) {
    const npc = npcs[i];
    npc.update();
    if (npc.state === 'leaving' && npc.x > canvas.width + npc.width) {
      npcs.splice(i, 1);
      movingIngredients = movingIngredients.filter(ing => ing.associatedNPC !== npc);
    }
  }
  movingIngredients.forEach(ing => ing.update());
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ingredientsPool.forEach(ing=>ing.draw());
  npcs.forEach(npc=>npc.draw());
  // draw counter desk in front of NPCs
  ctx.fillStyle = '#8B4513';
  const deskW = 400, deskH = 80;
  const deskX = canvas.width/2 - deskW/2;
  const deskY = canvas.height/2 + 20;
  ctx.fillRect(deskX, deskY, deskW, deskH);
  movingIngredients.forEach(ing=>ing.draw());
  ctx.fillStyle='black'; ctx.font='20px Arial';
  ctx.fillText('Click ingredients to assemble',20,30);
  ctx.fillText('Score: '+score,20,60);
}

function gameLoop(){ update(); draw(); requestAnimationFrame(gameLoop); }

canvas.addEventListener('click',e=>{
  const rect=canvas.getBoundingClientRect();
  const cx=e.clientX-rect.left, cy=e.clientY-rect.top;
  const queueList = npcs.filter(n=>n.state==='waiting');
  if (!queueList.length) return;
  const npc = queueList[0];
  for (const poolIng of ingredientsPool) {
    if (cx>=poolIng.x && cx<=poolIng.x+poolIng.width && cy>=poolIng.y && cy<=poolIng.y+poolIng.height) {
      if (poolIng.type===npc.order[npc.assembledCount]) {
        npc.assembledCount++;
        const newIng=new Ingredient(poolIng.type,poolIng.x,poolIng.y);
        newIng.state='moving'; newIng.associatedNPC=npc;
        newIng.orderIndex=npc.assembledCount-1;
        newIng.targetX=npc.x+(npc.width-newIng.width)/2;
        newIng.targetY=npc.y+npc.height+10+(npc.assembledCount-1)*(newIng.height+5);
        movingIngredients.push(newIng);
        if (npc.assembledCount===npc.order.length) {
          npc.faceExpression='happy';
          setTimeout(()=>{
            npc.state='leaving';
            movingIngredients=movingIngredients.filter(ing=>ing.associatedNPC!==npc);
          },500);
          score++;
        }
      } else {
        npc.faceExpression='sad';
        setTimeout(()=>npc.state='leaving',500);
      }
      break;
    }
  }
});

window.addEventListener('resize',()=>{
  canvas.width=window.innerWidth; canvas.height=window.innerHeight;
  initIngredients();
});

gameLoop();
