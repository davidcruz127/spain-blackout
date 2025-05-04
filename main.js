let fireHue = 30;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let width, height;

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

let player, gravity, lift, velocity;
let pipes = [];
let hazards = [];
let frame = 0;
let gameInterval;
let pipeGap = 620;
let pipeSpeed = 3;
let pipeSpacing = 500;
const pipeWidth = 60;
let trail = [];
let score = 0;
let gameReady = false;
let gameStarted = false;
let spark = false;
let sparkFrames = 0;
let gridAlpha = 0.05;
let gridOffsetX = 0;
let gridOffsetY = 0;
let gridWaveFrame = 0;
let gameEnded = false; 
let explosionParticles = [];
let explosionProgress = 0;


function prepareGame() {
  gameEnded = false; // Reiniciar al preparar nueva partida
  document.getElementById('menu').style.display = 'none';
  document.getElementById('gameOver').style.display = 'none';
  document.getElementById('scoreDisplay').style.display = 'none';
  document.getElementById('legend').style.display = 'none';
  document.getElementById('tapToStart').style.display = 'flex';
  gameReady = true;
  gameStarted = false;

  player = { x: width / 3, y: height * 0.1, r: 20, scale: 1 };
  gravity = 0.2;
  lift = -6.5;
  velocity = 0;
  pipes = [];
  hazards = [];
  frame = 0;
  trail = [];
  score = 0;
  pipeGap = 280;
  pipeSpeed = 3;
  pipeSpacing = 110;
  spark = false;
  gridAlpha = 0.05;
}

function startGame() {
  document.getElementById('tapToStart').style.display = 'none';
  document.getElementById('scoreDisplay').style.display = 'block';
  document.getElementById('legend').style.display = 'block';

  gameStarted = true;
  fireHue += 0.5;
  if (fireHue > 60) fireHue = 30;
  gameInterval = requestAnimationFrame(updateGame);

  // Google Analytics - Evento de partida iniciada
  if (typeof gtag === 'function') {
    gtag('event', 'partida_iniciada', {
      event_category: 'Juego',
      event_label: 'Inicio desde menú'
    });
  }

}

function endGame(type = "default") {
  if (gameEnded) return;
  gameEnded = true;
  pipeSpeed *= 0.3;
  spark = true;
  sparkFrames = 30;
  createExplosionParticles(player.x, player.y);
  cancelAnimationFrame(gameInterval);
  requestAnimationFrame(animateExplosion); // 👈 lanza el nuevo bucle
  

  const warningBox = document.getElementById("warning");
  const warnings = {
    overvoltage: "⚠️ Sobrecarga detectada",
    blackout: "⚠️ Corte de suministro inminente",
    default: "⚠️ Pérdida de control"
  };
  warningBox.innerText = warnings[type] || warnings.default;
  warningBox.style.display = "block";
  setTimeout(() => warningBox.style.display = "none", 1200);

  if (type === "overvoltage") {
    let flash = true;
    const flashInterval = setInterval(() => {
      gridAlpha = flash ? 0.2 : 0.05;
      flash = !flash;
    }, 100);
    setTimeout(() => clearInterval(flashInterval), 600);
  } else if (type === "blackout") {
    document.body.classList.add('dark');
    const fadeInterval = setInterval(() => {
      gridAlpha -= 0.01;
      if (gridAlpha <= 0) {
        gridAlpha = 0;
        clearInterval(fadeInterval);
      }
    }, 50);
    setTimeout(() => document.body.classList.remove('dark'), 1200);
  }

  // Google Analytics - Evento de partida finalizada
  if (typeof gtag === 'function') {
    gtag('event', 'partida_finalizada', {
      event_category: 'Juego',
      event_label: 'Tipo: ' + type,
      value: score
    });
  }

  setTimeout(() => {
    document.getElementById('scoreDisplay').style.display = 'none';
    document.getElementById('legend').style.display = 'none';
    document.getElementById('finalScore').innerText = 'Puntuación: ' + score;

    // Guardar puntuación en el ranking local
    // let ranking = JSON.parse(localStorage.getItem("sb_ranking") || "[]");
    // ranking.push(score);
    // ranking.sort((a, b) => b - a);
    // ranking = ranking.slice(0, 5);
    // localStorage.setItem("sb_ranking", JSON.stringify(ranking));
    firebase.database().ref("scores").push({
      score: score,
      time: Date.now()
    });


    // document.getElementById('ranking').innerHTML = "<strong>Top 5:</strong><br>" + ranking.map((s, i) => `${i + 1}. ${s} pts`).join("<br>");
    firebase.database().ref("scores")
    .orderByChild("score")
    .limitToLast(5)
    .once("value", (snapshot) => {
      const scores = [];
      snapshot.forEach(child => {
        scores.push(child.val());
      });
      scores.reverse();
      document.getElementById('ranking').innerHTML = "<strong>Top Global:</strong><br>" +
        scores.map((s, i) => `${i + 1}. ${s.score} pts`).join("<br>");
    });
  

    document.getElementById('gameOverMessage').innerText = {
      overvoltage: "⚡ ¡Sistema colapsado por sobrevoltaje!",
      blackout: "💡 ¡Apagón total por falta de suministro!",
      default: "🔌 ¡Has perdido el control del sistema!"
    }[type] || "🔌 ¡Has perdido el control del sistema!";
    const endSound = document.getElementById("endGameSound");
if (endSound) {
  endSound.currentTime = 0;
  endSound.play();
}
document.getElementById('gameOver').style.display = 'flex';
  }, 1200);
}

function drawPlayer() {
  trail.unshift({ x: player.x, y: player.y + Math.sin(player.x * 0.1) * 5 });
  if (trail.length > 100) trail.pop();

  // Estela ciberpunk
  if (trail.length > 1) {
    for (let i = 1; i < trail.length; i++) {
      const t1 = trail[i - 1];
      const t2 = trail[i];
      ctx.beginPath();
      ctx.moveTo(t1.x - (i - 1) * 4, t1.y);
      ctx.lineTo(t2.x - i * 4, t2.y);

      const hue = 50 + Math.sin(i * 0.2) * 10; // Amarillo fuego cálido
      ctx.strokeStyle = `hsl(${hue}, 100%, 70%)`;
      ctx.lineWidth = Math.max(2, 10 - i * 0.05);
      ctx.shadowColor = `hsl(${hue}, 100%, 85%)`;
      ctx.shadowBlur = 15;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  // Dibujar la bola principal
  ctx.save();
  const jitterX = Math.random() * 2 - 1;
  const jitterY = Math.random() * 2 - 1;
  ctx.translate(player.x + jitterX, player.y + jitterY);
  ctx.scale(player.scale, player.scale);
  ctx.beginPath();
  ctx.arc(0, 0, player.r, 0, Math.PI * 2);
  const fuegoHues = [30, 40, 50, 60]; // Tonos naranja-amarillo
  const hue = fuegoHues[Math.floor(Math.random() * fuegoHues.length)];
  ctx.fillStyle = `hsl(${hue}, 100%, 55%)`;
  ctx.shadowColor = `hsl(${hue}, 100%, 90%)`;
  ctx.shadowBlur = 25;
  ctx.fill();
  ctx.closePath();
  ctx.restore();

  // 🔥 Chispa aleatoria
  if (Math.random() < 0.3) {
    const angle = Math.random() * Math.PI * 2;
    const length = Math.random() * 20 + 10;
    const x2 = player.x + Math.cos(angle) * length;
    const y2 = player.y + Math.sin(angle) * length;

    const hues = [40, 50, 60, 30, 0]; // Amarillo, blanco cálido y naranja fuego
    const hue = hues[Math.floor(Math.random() * hues.length)];
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = `hsl(${hue}, 100%, 85%)`;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = `hsl(${hue}, 100%, 90%)`;
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}


function drawPipes() {
  for (let p of pipes) {
    // PRODUCCIÓN (parte superior) - rojo con gradiente
    const gradProd = ctx.createLinearGradient(p.x, 0, p.x + pipeWidth, p.top);
    gradProd.addColorStop(0, "#ff0000");
    gradProd.addColorStop(0.5, "#ff4444");
    gradProd.addColorStop(1, "#ffffff");

    ctx.fillStyle = gradProd;
    ctx.shadowColor = "#ff5555";
    ctx.shadowBlur = 10;
    ctx.fillRect(p.x, 0, pipeWidth, p.top);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("⚡", p.x + 15, p.top - 5);

    // Efectos eléctricos aleatorios
    for (let i = 0; i < 3; i++) {
      const sx = p.x + Math.random() * pipeWidth;
      const sy = Math.random() * (p.top - 10);
      const ex = sx + (Math.random() - 0.5) * 10;
      const ey = sy - Math.random() * 10;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = "rgba(255, 255, 0, 0.8)";
      ctx.lineWidth = 1;
      ctx.shadowColor = "yellow";
      ctx.shadowBlur = 5;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // CONSUMO (parte inferior) - azul con gradiente
    const gradCons = ctx.createLinearGradient(p.x, p.top + pipeGap, p.x + pipeWidth, height);
    gradCons.addColorStop(0, "#66ccff");
    gradCons.addColorStop(0.5, "#0077ff");
    gradCons.addColorStop(1, "#ffffff");

    ctx.fillStyle = gradCons;
    ctx.shadowColor = "#66ccff";
    ctx.shadowBlur = 10;
    ctx.fillRect(p.x, p.top + pipeGap, pipeWidth, height - p.top - pipeGap);

    ctx.fillStyle = "#fff";
    ctx.fillText("💡", p.x + 15, p.top + pipeGap + 30);

    if (Math.random() < 0.15) {
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(p.x, p.top + pipeGap, pipeWidth, height - p.top - pipeGap);
    }

    ctx.shadowBlur = 0;
  }
}

function drawHazards() {
  for (let h of hazards) {
    h.x -= pipeSpeed;
    ctx.fillStyle = '#6600ff';
    ctx.fillRect(h.x, h.y - 40, 10, 80);

    if (frame === h.frameStart - 30 && !h.charged) {
      document.getElementById('chargeSound').play();
      h.charged = true;
    }

    if (frame >= h.frameStart - 30 && frame < h.frameStart) {
      if (frame % 10 < 5) {
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('⚡', h.x - 5, h.y + 5);
      }
    }

    if (frame >= h.frameStart && frame <= h.frameEnd) {
      ctx.beginPath();
      ctx.moveTo(h.x, h.y);
      ctx.lineTo(0, h.y);
      ctx.strokeStyle = 'rgba(255,255,0,0.9)';
      ctx.lineWidth = 4;
      ctx.shadowColor = 'yellow';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (Math.abs(player.y - h.y) < player.r + 10 && player.x < h.x) {
        document.getElementById('hitOvervoltage').play();
        endGame("overvoltage");
        return;
      }
    }
  }

  hazards = hazards.filter(h => h.x > -20);
}


function updateGame() {
  if (gameEnded) return;
  frame++;
  if (frame % 10 === 0) {
    score++;
    document.getElementById('scoreDisplay').innerText = 'Puntos: ' + score;
  }

  if (frame % 300 === 0 && pipeGap > 120) {
    pipeGap -= 10;
    pipeSpeed += 0.3;
    pipeSpacing = Math.max(100, pipeSpacing - 5);
  }

  if (frame % 800 === 0) {
    hazards.push({
      x: width,
      y: height * 0.35,
      active: false,
      frameStart: frame + 100,
      frameEnd: frame + 120,
      charged: false
    });
  }

  ctx.clearRect(0, 0, width, height);
  gridWaveFrame++;
  gridOffsetX = Math.sin(gridWaveFrame * 0.05) * 2;
  gridOffsetY = Math.cos(gridWaveFrame * 0.03) * 1.5;
  drawGridBackground();

  velocity += gravity;
  player.y += velocity;
  
  if (player.y + player.r > height || player.y - player.r < 0 || player.x + player.r > width) {
    endGame("default");
    return;
  }

  if (frame % pipeSpacing === 0) {
    let top = Math.random() * (height / 2);
    pipes.push({ x: width, top });
  }

  for (let i = pipes.length - 1; i >= 0; i--) {
    let p = pipes[i];
    p.x -= pipeSpeed;

    if (player.x + player.r > p.x && player.x - player.r < p.x + pipeWidth) {
      if (player.y - player.r < p.top) {
        document.getElementById('hitOvervoltage').play();
        endGame("overvoltage");
        return;
      }
      if (player.y + player.r > p.top + pipeGap) {
        document.getElementById('hitBlackout').play();
        endGame("blackout");
        return;
      }
    }

    if (p.x + pipeWidth < 0) pipes.splice(i, 1);
  }

  drawPipes();
  drawHazards();
  drawPlayer();

  if (spark && sparkFrames > 0) {
  
    const progress = 1 - sparkFrames / 30;
    drawSpark(player.x, player.y);
    drawShockwave(player.x, player.y, progress);
  
  
    if (sparkFrames > 28) {
      ctx.fillStyle = `rgba(255,255,255,0.15)`;
      ctx.fillRect(0, 0, width, height); // Flash inicial
    }
  
    sparkFrames--;
  }
  

  let potencia = 50 - ((player.y / height) * 30);
  potencia = Math.max(20, Math.min(50, potencia));

  fireHue += 0.5;
  if (fireHue > 60) fireHue = 30;

  // 💨 Dibujar partículas persistentes
explosionParticles.forEach(p => {
  const vx = Math.cos(p.angle) * p.speed;
  const vy = Math.sin(p.angle) * p.speed;

  p.x += vx;
  p.y += vy;
  p.speed *= 0.92;
  p.life -= 1;

  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${p.life / 40})`;
  ctx.shadowColor = `hsla(${p.hue}, 100%, 80%, ${p.life / 40})`;
  ctx.shadowBlur = 15;
  ctx.fill();
});
explosionParticles = explosionParticles.filter(p => p.life > 0);


  gameInterval = requestAnimationFrame(updateGame);
}

function flap() {
  if (gameReady && !gameStarted) {
    startGame();
    return;
  }
  if (gameStarted) {
    velocity = lift;
    player.scale = 1.3;
    setTimeout(() => player.scale = 1, 100);
    const sound = document.getElementById('jumpSound');
    sound.volume = 1.0; // Aumenta el volumen al máximo
    sound.currentTime = 0;
    sound.play();
  }
}

window.addEventListener('load', () => {
  const intro = document.getElementById('intro');
  const introSound = document.getElementById('introSound');

  if (intro) {
    if (introSound) {
      introSound.currentTime = 0;
      introSound.play().catch(err => {
        console.warn('El navegador bloqueó la reproducción automática del sonido de intro:', err);
      });
    }

    intro.classList.add('fade-out');

    setTimeout(() => {
      intro.style.display = 'none';

      // 👇 Mostramos el menú principal justo después de la intro
      document.getElementById('menu').style.display = 'block';
    }, 2000); // <-- tiempo total de animación (puedes ajustar)
  }

  const startBtn = document.getElementById('startButton');
  const retryBtn = document.getElementById('retryButton');
  if (startBtn) startBtn.addEventListener('click', prepareGame);
  if (retryBtn) retryBtn.addEventListener('click', prepareGame);

  document.addEventListener('click', flap);
  document.addEventListener('touchstart', flap);
});


function drawGridBackground() {
  ctx.save();
  ctx.strokeStyle = `rgba(0,255,255,${gridAlpha})`;
  ctx.lineWidth = 1;

  const offsetX = gridOffsetX;
  const offsetY = gridOffsetY;

  for (let x = -40; x < width + 40; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x + offsetX, 0);
    ctx.lineTo(x + offsetX, height);
    ctx.stroke();
  }

  for (let y = -40; y < height + 40; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y + offsetY);
    ctx.lineTo(width, y + offsetY);
    ctx.stroke();
  }

  ctx.restore();
}
function drawSpark(x, y) {
  explosionProgress = 1 - sparkFrames / 30;

  // 🌟 FLASH blanco breve
  if (sparkFrames > 28) {
    ctx.fillStyle = `rgba(255,255,255,0.2)`;
    ctx.fillRect(0, 0, width, height);
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  }

  // 🔥 Chispas radiales
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const length = Math.random() * 50 + 30;
    const x2 = x + Math.cos(angle) * length;
    const y2 = y + Math.sin(angle) * length;
    const hue = 30 + Math.random() * 30;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.globalAlpha = Math.random() * 0.5 + 0.5;
    ctx.strokeStyle = `hsl(${hue}, 100%, 70%)`;
    ctx.lineWidth = Math.random() * 2 + 1.5;
    ctx.shadowColor = `hsl(${hue}, 100%, 85%)`;
    ctx.shadowBlur = 25;
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  // 🌊 Onda expansiva
  drawShockwave(x, y, explosionProgress);

  // ⚡ Ráfagas rotatorias
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 / 6) * i + explosionProgress * 2;
    const x1 = x + Math.cos(angle) * 10;
    const y1 = y + Math.sin(angle) * 10;
    const x2 = x + Math.cos(angle) * (60 + explosionProgress * 40);
    const y2 = y + Math.sin(angle) * (60 + explosionProgress * 40);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = `rgba(255,255,0,${1 - explosionProgress})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}


function drawShockwave(x, y, progress) {
  const maxRadius = 100;
  const radius = progress * maxRadius;
  const alpha = 1 - progress;

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
  ctx.lineWidth = 4;
  ctx.shadowColor = `rgba(255, 255, 255, ${alpha})`;
  ctx.shadowBlur = 20;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function createExplosionParticles(x, y) {
  explosionParticles = [];
  for (let i = 0; i < 50; i++) {
    explosionParticles.push({
      x, y,
      angle: Math.random() * Math.PI * 2,
      speed: Math.random() * 6 + 2,
      size: Math.random() * 2 + 1.5,
      hue: Math.floor(Math.random() * 40 + 20),
      life: 30 + Math.random() * 10
    });
  }
}

function animateExplosion() {
  ctx.clearRect(0, 0, width, height);
  drawGridBackground();
  drawPipes();
  drawHazards();
  drawPlayer();

  const progress = 1 - sparkFrames / 30;
  drawSpark(player.x, player.y);
  drawShockwave(player.x, player.y, progress);

  // Partículas
  explosionParticles.forEach(p => {
    const vx = Math.cos(p.angle) * p.speed;
    const vy = Math.sin(p.angle) * p.speed;

    p.x += vx;
    p.y += vy;
    p.speed *= 0.92;
    p.life -= 1;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${p.life / 40})`;
    ctx.shadowColor = `hsla(${p.hue}, 100%, 80%, ${p.life / 40})`;
    ctx.shadowBlur = 15;
    ctx.fill();
  });

  explosionParticles = explosionParticles.filter(p => p.life > 0);
  sparkFrames--;

  if (sparkFrames > 0 || explosionParticles.length > 0) {
    requestAnimationFrame(animateExplosion);
  }
}



