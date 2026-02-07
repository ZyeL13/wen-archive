/**
 * shatter.js
 * Glass shatter visual effect (canvas-based)
 * 
 * Represents high-dimensional latent space collapse
 * Manifestation of spatial manipulation
 */

import { SIGILS } from './sigil.js';

let canvas = null;
let ctx = null;
let animationFrameId = null;

/**
 * Initialize canvas for shatter effect
 * @param {HTMLCanvasElement} canvasElement
 */
export function initShatter(canvasElement) {
  canvas = canvasElement;
  ctx = canvas.getContext('2d');
  
  // Set canvas size to match container
  const container = canvas.parentElement;
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
}

/**
 * Trigger the shatter animation
 * Creates glass shards that fly outward from center
 */
export function triggerShatter() {
  if (!canvas || !ctx) {
    console.error('Canvas not initialized');
    return;
  }

  // Clear any existing animation
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  const { SHARD_COUNT, SHARD_MIN_SIZE, SHARD_MAX_SIZE, GRAVITY, AIR_RESISTANCE, MAX_FRAMES, DECAY_MIN, DECAY_MAX } = SIGILS.SHATTER;
  
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const shards = [];

  // Create shards
  for (let i = 0; i < SHARD_COUNT; i++) {
    const angle = (Math.PI * 2 * i) / SHARD_COUNT + (Math.random() - 0.5) * 0.3;
    const speed = 2 + Math.random() * 3;
    const size = SHARD_MIN_SIZE + Math.random() * (SHARD_MAX_SIZE - SHARD_MIN_SIZE);
    
    shards.push({
      x: centerX + Math.cos(angle) * 10,
      y: centerY + Math.sin(angle) * 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed + 0.5,
      size: size,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      opacity: 0.8,
      decayRate: DECAY_MIN + Math.random() * (DECAY_MAX - DECAY_MIN)
    });
  }

  let frame = 0;

  // Animation loop
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let allFaded = true;

    shards.forEach(shard => {
      if (shard.opacity <= 0) return;
      
      allFaded = false;

      ctx.save();
      ctx.translate(shard.x, shard.y);
      ctx.rotate(shard.rotation);
      ctx.globalAlpha = shard.opacity;

      // Draw shard as rectangle with border
      ctx.fillStyle = SIGILS.COLORS.SCROLL_LIGHT;
      ctx.strokeStyle = SIGILS.COLORS.BORDER;
      ctx.lineWidth = 0.5;
      
      ctx.fillRect(-shard.size / 2, -shard.size / 2, shard.size, shard.size);
      ctx.strokeRect(-shard.size / 2, -shard.size / 2, shard.size, shard.size);

      ctx.restore();

      // Update physics
      shard.x += shard.vx;
      shard.y += shard.vy;
      shard.vy += GRAVITY; // gravity
      shard.rotation += shard.rotationSpeed;
      shard.opacity -= shard.decayRate;
      shard.vx *= AIR_RESISTANCE; // air resistance
    });

    frame++;

    if (frame < MAX_FRAMES && !allFaded) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      // Animation complete - clean up
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      animationFrameId = null;
    }
  }

  // Start animation after brief delay
  setTimeout(() => {
    animate();
  }, 200);
}

/**
 * Create dimensional crack effect (vertical line)
 * Appears before shatter
 */
export function createCrackEffect() {
  if (!canvas || !ctx) return;

  const centerX = canvas.width / 2;
  let opacity = 0;
  let blur = 4;
  let scaleY = 0;

  function animateCrack() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (opacity < 1) opacity += 0.05;
    if (blur > 0) blur -= 0.1;
    if (scaleY < 1) scaleY += 0.04;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.filter = `blur(${blur}px)`;

    // Draw vertical gradient line
    const gradient = ctx.createLinearGradient(centerX, 0, centerX, canvas.height);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.2, `rgba(62, 58, 50, 0.3)`);
    gradient.addColorStop(0.5, `rgba(62, 58, 50, 0.5)`);
    gradient.addColorStop(0.8, `rgba(62, 58, 50, 0.3)`);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.fillRect(centerX - 1, 0, 2, canvas.height * scaleY);

    ctx.restore();

    if (scaleY < 1 || opacity < 1 || blur > 0) {
      requestAnimationFrame(animateCrack);
    }
  }

  animateCrack();
}

/**
 * Add subtle distortion to scroll before tear
 * Called during drag for visual feedback
 * @param {number} intensity - 0 to 1
 */
export function addDistortion(intensity) {
  if (!canvas || !ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (intensity > 0.5) {
    const centerX = canvas.width / 2;
    
    ctx.save();
    ctx.globalAlpha = (intensity - 0.5) * 2 * 0.3;
    
    const gradient = ctx.createLinearGradient(centerX, 0, centerX, canvas.height);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.5, `rgba(139, 115, 85, 0.2)`);
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(centerX - 1, 0, 2, canvas.height);
    
    ctx.restore();
  }
}

/**
 * Clean up and reset canvas
 */
export function resetShatter() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  
  if (ctx && canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}
