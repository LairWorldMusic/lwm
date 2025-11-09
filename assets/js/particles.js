(function(){
  // Simple particle network background
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return; // respect user setting

  const isMobile = window.matchMedia('(max-width: 720px)').matches;

  const canvas = document.createElement('canvas');
  canvas.className = 'bg-net';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let width = 0, height = 0, dpr = Math.max(1, Math.min(isMobile ? 1.25 : 2, window.devicePixelRatio || 1));
  // Higher contrast defaults for light theme + colorful palette
  let color = { dot: 'rgba(20,20,30,1)', lineBase: [20,20,30] };
  let contrastAlpha = 0.75; // line opacity factor
  let lineW = 1.6;          // line width
  let dotBoost = 0;         // extra radius on dark theme
  let palette = { a:[60,65,75], b:[60,65,75] }; // neutral gray
  let dotAlpha = 1.0;

  function rgba(arr, a){ return `rgba(${arr[0]},${arr[1]},${arr[2]},${a})`; }
  function mix(c1, c2, t){ return [
    Math.round(c1[0] + (c2[0]-c1[0])*t),
    Math.round(c1[1] + (c2[1]-c1[1])*t),
    Math.round(c1[2] + (c2[2]-c1[2])*t),
  ]; }

  let lastResizeWidth = 0;
  let lastResizeHeight = 0;
  let isInitialized = false;
  
  function resize(){
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    
    // При первой инициализации всегда обновляем
    if (!isInitialized) {
      width = canvas.clientWidth = newWidth;
      height = canvas.clientHeight = newHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastResizeWidth = newWidth;
      lastResizeHeight = newHeight;
      isInitialized = true;
      return;
    }
    
    // Проверяем, действительно ли изменился размер (более 10px)
    if (Math.abs(newWidth - lastResizeWidth) < 10 && Math.abs(newHeight - lastResizeHeight) < 10) {
      return; // Размер не изменился значительно, не обновляем
    }
    
    width = canvas.clientWidth = newWidth;
    height = canvas.clientHeight = newHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    lastResizeWidth = newWidth;
    lastResizeHeight = newHeight;
  }

  // Particles
  const particles = [];
  const MAX_PARTICLES = isMobile ? 20 : 110;
  const LINK_DISTANCE = isMobile ? 80 : 120;
  const MOUSE_RADIUS = isMobile ? 110 : 160;
  const SPEED = isMobile ? 0.15 : 0.25;

  function random(min, max){ return Math.random() * (max - min) + min; }

  function createParticle(){
    return {
      x: random(0, width),
      y: random(0, height),
      vx: random(-SPEED, SPEED),
      vy: random(-SPEED, SPEED),
      r: random(1.6, 2.6)
    };
  }

  function init(){
    particles.length = 0;
    // На мобильных используем фиксированное количество
    const count = isMobile ? MAX_PARTICLES : Math.min(MAX_PARTICLES, Math.round((width * height) / 18000));
    for (let i = 0; i < count; i++) particles.push(createParticle());
  }

  const mouse = { x: -9999, y: -9999 };
  window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  let lastTs = 0;
  let frameSkip = 0;
  function step(ts){
    // Throttle FPS на мобильных ~20fps (пропускаем каждый второй кадр)
    if (isMobile) {
      frameSkip++;
      if (frameSkip % 2 !== 0) {
        requestAnimationFrame(step);
        return;
      }
    } else if (ts && lastTs && (ts - lastTs) < 16) {
      requestAnimationFrame(step);
      return;
    }
    lastTs = ts || 0;
    ctx.clearRect(0, 0, width, height);

    // Move and draw particles (colored)
    for (let i = 0; i < particles.length; i++){
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x <= 0 || p.x >= width) p.vx *= -1;
      if (p.y <= 0 || p.y >= height) p.vy *= -1;

      // subtle mouse repel (только на десктопе)
      if (!isMobile) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const dist2 = dx*dx + dy*dy;
        if (dist2 < MOUSE_RADIUS*MOUSE_RADIUS){
          const k = (MOUSE_RADIUS - Math.sqrt(dist2)) / MOUSE_RADIUS;
          p.x += (dx/Math.max(1, Math.sqrt(dist2))) * k * 2.2;
          p.y += (dy/Math.max(1, Math.sqrt(dist2))) * k * 2.2;
        }
      }

      // neutral color
      ctx.fillStyle = rgba(palette.a, dotAlpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + dotBoost, 0, Math.PI * 2);
      ctx.fill();
    }

    // Lines - оптимизация для мобильных: проверяем меньше связей
    const lineCheckStep = isMobile ? 2 : 1;
    for (let i = 0; i < particles.length; i += lineCheckStep){
      for (let j = i + 1; j < particles.length; j += lineCheckStep){
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const distSq = dx*dx + dy*dy; // используем квадрат расстояния для сравнения
        if (distSq < LINK_DISTANCE * LINK_DISTANCE){
          const dist = Math.sqrt(distSq);
          const alpha = contrastAlpha * (1 - dist / LINK_DISTANCE);
          // neutral line color
          ctx.strokeStyle = rgba(palette.a, alpha);
          ctx.lineWidth = lineW;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(step);
  }

  function start(){ 
    resize(); 
    lastResizeWidth = width;
    lastResizeHeight = height;
    init(); 
    requestAnimationFrame(step); 
  }
  
  // Отслеживание скролла для предотвращения resize во время прокрутки
  let isScrolling = false;
  let scrollTimeout = null;
  if (isMobile) {
    window.addEventListener('scroll', () => {
      isScrolling = true;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
      }, 300);
    }, { passive: true });
  }
  
  // Debounce для resize, чтобы избежать частых перерисовок при скролле
  let resizeTimeout;
  window.addEventListener('resize', () => {
    // На мобильных игнорируем resize во время скролла
    if (isMobile && isScrolling) {
      return;
    }
    
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const oldWidth = width;
      const oldHeight = height;
      resize();
      // Переинициализируем частицы только если размер действительно изменился значительно (более 50px)
      if (Math.abs(width - oldWidth) > 50 || Math.abs(height - oldHeight) > 50) {
        init();
      }
    }, 300);
  }, { passive: true });
  // Pause when tab hidden to save battery
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { lastTs = 0; }
  });
  // set initial theme contrast
  (function syncInitialTheme(){
    const t = document.documentElement.getAttribute('data-theme');
    if (t === 'gray'){
      color = { dot: 'rgba(255,255,255,0.98)', lineBase: [255,255,255] };
      contrastAlpha = 0.9; lineW = 1.9; dotBoost = 0.6; dotAlpha = 0.95;
      palette = { a:[235,235,245], b:[235,235,245] };
    } else {
      color = { dot: 'rgba(20,20,30,1)', lineBase: [20,20,30] };
      contrastAlpha = 0.75; lineW = 1.6; dotBoost = 0; dotAlpha = 1.0;
      palette = { a:[60,65,75], b:[60,65,75] };
    }
  })();

  // react to theme switch
  document.addEventListener('themechange', (e) => {
    const theme = e.detail?.theme;
    if (theme === 'gray'){
      // On dark background, make dots/lines lighter & thicker, keep neutral color
      color = { dot: 'rgba(255,255,255,0.98)', lineBase: [255,255,255] };
      contrastAlpha = 0.9; lineW = 1.9; dotBoost = 0.6; dotAlpha = 0.95;
      palette = { a:[235,235,245], b:[235,235,245] };
    } else {
      color = { dot: 'rgba(20,20,30,1)', lineBase: [20,20,30] };
      contrastAlpha = 0.75; lineW = 1.6; dotBoost = 0; dotAlpha = 1.0;
      palette = { a:[60,65,75], b:[60,65,75] };
    }
  });
  start();
})();

