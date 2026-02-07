/**
 * tear.js
 * Handles scroll tear interaction, drag detection, and validation
 * 
 * Responsibilities:
 * - Detect horizontal drag gesture
 * - Validate tear eligibility (1x per day)
 * - Coordinate with shatter.js for animation
 * - Trigger state update via memory.js
 */

import { hasTearedToday, getCurrentDay } from './memory.js';
import { triggerShatter } from './shatter.js';
import { onTearComplete } from './ritual.js';
import { SIGILS } from './sigil.js';

class TearHandler {
  constructor(scrollElement) {
    this.scroll = scrollElement;
    this.isDragging = false;
    this.startX = 0;
    this.currentX = 0;
    this.tearThreshold = SIGILS.TEAR_THRESHOLD; // 50px default
    
    this.init();
  }

  init() {
    // Mouse events
    this.scroll.addEventListener('mousedown', this.handleStart.bind(this));
    document.addEventListener('mousemove', this.handleMove.bind(this));
    document.addEventListener('mouseup', this.handleEnd.bind(this));

    // Touch events
    this.scroll.addEventListener('touchstart', this.handleStart.bind(this), { passive: true });
    document.addEventListener('touchmove', this.handleMove.bind(this), { passive: true });
    document.addEventListener('touchend', this.handleEnd.bind(this));
  }

  handleStart(e) {
    // Check if already torn today
    if (hasTearedToday()) {
      this.showAlreadyTorn();
      return;
    }

    this.isDragging = true;
    this.scroll.classList.add('dragging');
    this.startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
  }

  handleMove(e) {
    if (!this.isDragging) return;

    this.currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const deltaX = Math.abs(this.currentX - this.startX);

    if (deltaX < 100) {
      // Visual feedback: slight distortion
      const direction = this.currentX > this.startX ? 1 : -1;
      const scale = 1 + deltaX * 0.0005;
      const rotation = direction * deltaX * 0.05;

      this.scroll.style.transform = `scale(${scale}) rotateZ(${rotation}deg)`;

      // Add "ready to tear" state
      if (deltaX > this.tearThreshold) {
        this.scroll.classList.add('ready-to-tear');
      } else {
        this.scroll.classList.remove('ready-to-tear');
      }
    }
  }

  handleEnd(e) {
    if (!this.isDragging) return;

    const deltaX = Math.abs(this.currentX - this.startX);

    if (deltaX > this.tearThreshold) {
      // Sufficient force - execute tear
      this.executeTear();
    } else {
      // Insufficient - snap back
      this.snapBack();
    }

    this.isDragging = false;
  }

  executeTear() {
    // Transition animation
    this.scroll.style.transition = 'transform 0.3s ease';
    this.scroll.style.transform = 'scale(1.1)';

    setTimeout(() => {
      // Trigger visual shatter effect
      triggerShatter();

      // Clean up scroll element
      this.scroll.style.transform = '';
      this.scroll.style.transition = '';
      this.scroll.classList.remove('dragging', 'ready-to-tear');

      // Notify ritual.js that tear is complete
      onTearComplete();
    }, 300);
  }

  snapBack() {
    this.scroll.style.transition = 'transform 0.3s ease';
    this.scroll.style.transform = '';

    setTimeout(() => {
      this.scroll.style.transition = '';
    }, 300);

    this.scroll.classList.remove('dragging', 'ready-to-tear');
  }

  showAlreadyTorn() {
    // Subtle feedback - scroll slightly vibrates then stops
    this.scroll.style.animation = 'refuseShake 0.3s ease';
    
    setTimeout(() => {
      this.scroll.style.animation = '';
    }, 300);
  }

  destroy() {
    // Clean up event listeners
    this.scroll.removeEventListener('mousedown', this.handleStart);
    document.removeEventListener('mousemove', this.handleMove);
    document.removeEventListener('mouseup', this.handleEnd);
    this.scroll.removeEventListener('touchstart', this.handleStart);
    document.removeEventListener('touchmove', this.handleMove);
    document.removeEventListener('touchend', this.handleEnd);
  }
}

// Export singleton instance
let tearHandlerInstance = null;

export function initTear(scrollElement) {
  if (tearHandlerInstance) {
    tearHandlerInstance.destroy();
  }
  tearHandlerInstance = new TearHandler(scrollElement);
}

export function disableTear() {
  if (tearHandlerInstance) {
    tearHandlerInstance.destroy();
    tearHandlerInstance = null;
  }
}
