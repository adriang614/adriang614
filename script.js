const typedWord = document.querySelector('#typed-word');
const words = ['proyectos.', 'experimentos.', 'ideas nuevas.'];
let wordIndex = 0;
let charIndex = words[0].length;
let deleting = false;

function typeLoop() {
  const word = words[wordIndex];
  charIndex += deleting ? -1 : 1;
  typedWord.textContent = word.slice(0, charIndex);
  let delay = deleting ? 55 : 105;
  if (!deleting && charIndex === word.length) {
    deleting = true;
    delay = 1500;
  } else if (deleting && charIndex === 0) {
    deleting = false;
    wordIndex = (wordIndex + 1) % words.length;
    delay = 350;
  }
  window.setTimeout(typeLoop, delay);
}
window.setTimeout(typeLoop, 1800);

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((section) => revealObserver.observe(section));

// Snake arcade — no dependencias, con controles de teclado y gestos táctiles.
const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const gridSize = 20;
const cells = canvas.width / gridSize;
const scoreElement = document.querySelector('#score');
const bestElement = document.querySelector('#best-score');
const statusElement = document.querySelector('#game-status');
const statusDot = document.querySelector('#status-dot');
const overlay = document.querySelector('#game-overlay');
const startButton = document.querySelector('#start-game');
let snake;
let food;
let direction;
let nextDirection;
let score = 0;
let best = Number(localStorage.getItem('adrian-snake-best') || 0);
let running = false;
let gameOver = false;
let timer;

bestElement.textContent = String(best).padStart(2, '0');

function randomFood() {
  let candidate;
  do {
    candidate = { x: Math.floor(Math.random() * cells), y: Math.floor(Math.random() * cells) };
  } while (snake.some((part) => part.x === candidate.x && part.y === candidate.y));
  return candidate;
}

function drawBoard() {
  ctx.fillStyle = '#090c12';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(166,243,107,.055)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= cells; i += 1) {
    ctx.beginPath(); ctx.moveTo(i * gridSize, 0); ctx.lineTo(i * gridSize, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * gridSize); ctx.lineTo(canvas.width, i * gridSize); ctx.stroke();
  }
  if (!snake || !food) return;

  ctx.save();
  ctx.shadowColor = '#f3a5ff';
  ctx.shadowBlur = 15;
  ctx.fillStyle = '#f3a5ff';
  ctx.beginPath();
  ctx.arc(food.x * gridSize + gridSize / 2, food.y * gridSize + gridSize / 2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  snake.forEach((part, index) => {
    const inset = index === 0 ? 2 : 3;
    ctx.fillStyle = index === 0 ? '#d2ffab' : `rgba(166,243,107,${Math.max(.35, 1 - index * .025)})`;
    ctx.shadowColor = index === 0 ? '#a6f36b' : 'transparent';
    ctx.shadowBlur = index === 0 ? 12 : 0;
    ctx.beginPath();
    ctx.roundRect(part.x * gridSize + inset, part.y * gridSize + inset, gridSize - inset * 2, gridSize - inset * 2, 5);
    ctx.fill();
  });
  ctx.shadowBlur = 0;
}

function resetGame() {
  snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  gameOver = false;
  food = randomFood();
  scoreElement.textContent = '00';
  drawBoard();
}

function setStatus(text, active = false) {
  statusElement.textContent = text;
  statusDot.style.background = active ? 'var(--green)' : '#858797';
  statusDot.style.boxShadow = active ? '0 0 11px var(--green)' : 'none';
}

function finishGame(won = false) {
  running = false;
  gameOver = true;
  window.clearInterval(timer);
  setStatus(won ? '¡PARTIDA PERFECTA!' : 'FIN DE LA PARTIDA');
  overlay.classList.remove('hidden');
  overlay.querySelector('span:nth-child(2)').textContent = won ? '¡INCREÍBLE!' : 'GAME OVER';
  overlay.querySelector('small').textContent = 'PULSA JUGAR OTRA VEZ';
  startButton.innerHTML = 'Jugar otra vez <span>↻</span>';
}

function tick() {
  direction = nextDirection;
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
  const eating = head.x === food.x && head.y === food.y;
  const bodyToCheck = eating ? snake : snake.slice(0, -1);
  if (head.x < 0 || head.x >= cells || head.y < 0 || head.y >= cells || bodyToCheck.some((part) => part.x === head.x && part.y === head.y)) {
    finishGame();
    return;
  }
  snake.unshift(head);
  if (eating) {
    score += 1;
    scoreElement.textContent = String(score).padStart(2, '0');
    if (score > best) {
      best = score;
      bestElement.textContent = String(best).padStart(2, '0');
      localStorage.setItem('adrian-snake-best', String(best));
    }
    if (snake.length === cells * cells) {
      drawBoard();
      finishGame(true);
      return;
    }
    food = randomFood();
  } else {
    snake.pop();
  }
  drawBoard();
}

function startGame() {
  if (running) {
    running = false;
    window.clearInterval(timer);
    setStatus('PARTIDA EN PAUSA');
    overlay.classList.remove('hidden');
    overlay.querySelector('span:nth-child(2)').textContent = 'EN PAUSA';
    overlay.querySelector('small').textContent = 'PULSA CONTINUAR PARA SEGUIR';
    startButton.innerHTML = 'Continuar <span>→</span>';
    return;
  }
  if (gameOver) resetGame();
  running = true;
  setStatus('EN PARTIDA', true);
  overlay.classList.add('hidden');
  startButton.innerHTML = 'Pausar partida <span>Ⅱ</span>';
  timer = window.setInterval(tick, Math.max(75, 135 - score * 2));
}

function changeDirection(key) {
  const directions = {
    ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 },
  };
  const proposed = directions[key];
  if (!proposed || (proposed.x === -direction.x && proposed.y === -direction.y)) return false;
  nextDirection = proposed;
  return true;
}

document.addEventListener('keydown', (event) => {
  if (changeDirection(event.key)) {
    if (event.key.startsWith('Arrow')) event.preventDefault();
    if (!running && !gameOver) startGame();
  } else if (event.code === 'Space' && document.activeElement !== startButton) {
    event.preventDefault();
    startGame();
  }
});
startButton.addEventListener('click', startGame);

let touchStart = null;
canvas.addEventListener('touchstart', (event) => {
  const touch = event.changedTouches[0];
  touchStart = { x: touch.clientX, y: touch.clientY };
}, { passive: true });
canvas.addEventListener('touchend', (event) => {
  if (!touchStart) return;
  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;
  touchStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
  const key = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft') : (dy > 0 ? 'ArrowDown' : 'ArrowUp');
  if (changeDirection(key) && !running && !gameOver) startGame();
}, { passive: true });

resetGame();
setStatus('LISTO PARA JUGAR');
