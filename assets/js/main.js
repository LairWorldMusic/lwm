// Main interactions: page transitions, nav toggle, reveal on scroll, rotating words, form mock submit
(function () {
    const $ = (s, scope = document) => scope.querySelector(s);
    const $$ = (s, scope = document) => Array.from(scope.querySelectorAll(s));

    // Loading Screen with Particles Animation
    window.addEventListener('load', () => {
      const loadingScreen = $('#loadingScreen');
      const canvas = $('#loadingCanvas');
      
      if (canvas) {
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Определяем цвет частиц в зависимости от темы
        const theme = document.documentElement.getAttribute('data-theme');
        const isDark = theme === 'gray';
        const particleColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.7)';
        const lineColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.25)';
        
        // Частицы
        const particles = [];
        // Уменьшаем количество частиц на мобильных устройствах для лучшей производительности
        const isMobile = window.innerWidth <= 768;
        const particleCount = isMobile ? 20 : 80;
        const maxDistance = isMobile ? 60 : 120;
        
        class Particle {
          constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.radius = Math.random() * 2 + 1;
          }
          
          update() {
            this.x += this.vx;
            this.y += this.vy;
            
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
          }
          
          draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = particleColor;
            ctx.fill();
          }
        }
        
        // Создаем частицы
        for (let i = 0; i < particleCount; i++) {
          particles.push(new Particle());
        }
        
        // Анимация
        function animate() {
          if (!loadingScreen || loadingScreen.classList.contains('hidden')) return;
          
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Обновляем и рисуем частицы
          particles.forEach(particle => {
            particle.update();
            particle.draw();
          });
          
          // Соединяем близкие частицы линиями
          // Оптимизация для мобильных: проверяем меньше связей
          const lineCheckStep = isMobile ? 2 : 1;
          for (let i = 0; i < particles.length; i += lineCheckStep) {
            for (let j = i + 1; j < particles.length; j += lineCheckStep) {
              const dx = particles[i].x - particles[j].x;
              const dy = particles[i].y - particles[j].y;
              const distSq = dx * dx + dy * dy;
              const maxDistSq = maxDistance * maxDistance;
              
              if (distSq < maxDistSq) {
                const distance = Math.sqrt(distSq);
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = lineColor;
                ctx.lineWidth = 1 - distance / maxDistance;
                ctx.stroke();
              }
            }
          }
          
          requestAnimationFrame(animate);
        }
        
        animate();
      }
      
      if (loadingScreen) {
        // Ускоренный сценарий загрузки: ~1.2s анимации + 0.8s скрытие = ~2s
        setTimeout(() => {
          loadingScreen.classList.add('hidden');
          // Удаляем элемент после анимации скрытия и инициируем каскадное появление
          setTimeout(() => {
            loadingScreen.remove();
            document.dispatchEvent(new CustomEvent('loadingHidden'));
          }, 800);
        }, 1200);
      }
    });
  
    // Theme: apply saved theme and prepare toggle
    const THEME_KEY = 'lwm-theme';
    function applyTheme(theme){
      const root = document.documentElement;
      const isDark = theme === 'gray';
      // сброс противоположного класса
      root.classList.remove('is-theming-dark', 'is-theming-light');
      // поставить нужный класс для анимации, только если вкладка активна
      if (!document.hidden) root.classList.add(isDark ? 'is-theming-dark' : 'is-theming-light');
      root.setAttribute('data-theme', theme);
      try{ localStorage.setItem(THEME_KEY, theme); }catch{}
      document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
      if (!document.hidden){
        setTimeout(() => { root.classList.remove('is-theming-dark', 'is-theming-light'); }, 900);
      } else {
        root.classList.remove('is-theming-dark', 'is-theming-light');
      }
    }
    (function initTheme(){
      const saved = (()=>{ try{ return localStorage.getItem(THEME_KEY); }catch{ return null; } })();
      const theme = saved === 'gray' ? 'gray' : 'light';
      applyTheme(theme);
    })();

    // Theme toggle button handler
    window.addEventListener('DOMContentLoaded', () => {
      const btn = document.getElementById('themeToggle');
      if (btn) {
        btn.addEventListener('click', () => {
          const current = document.documentElement.getAttribute('data-theme') || 'light';
          applyTheme(current === 'light' ? 'gray' : 'light');
        });
      }
    });

    // Remove loading overlay on load
    window.addEventListener('load', () => {
      document.body.classList.remove('is-loading');
      // initial reveal for above-the-fold
      setTimeout(() => {
        $$('.reveal').forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight - 40) el.classList.add('is-visible');
        });
      }, 120);
    });

    // Каскадное появление контента после скрытия загрузочного экрана
    document.addEventListener('loadingHidden', () => {
      const items = $$('.reveal');
      items.forEach((el, i) => {
        setTimeout(() => el.classList.add('is-visible'), 120 * i);
      });
    });
  
    // Mobile burger toggle
    const burger = $('#burger');
    const nav = $('#site-nav');
    if (burger && nav) {
      // Создаем overlay для затемнения фона - ПОСЛЕ меню в DOM
      let overlay = $('#nav-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'nav-overlay';
        overlay.className = 'nav-overlay';
        // Вставляем overlay ПОСЛЕ меню, чтобы меню было выше в z-index
        nav.parentNode.insertBefore(overlay, nav.nextSibling);
      }
      
      function closeMobileMenu() {
        if (window.innerWidth <= 720) {
          burger.setAttribute('aria-expanded', 'false');
          nav.classList.remove('is-open');
          overlay.classList.remove('is-open');
        }
      }
      
      function openMobileMenu() {
        if (window.innerWidth <= 720) {
          nav.classList.add('is-open');
          overlay.classList.add('is-open');
        }
      }
      
      burger.addEventListener('click', () => {
        const expanded = burger.getAttribute('aria-expanded') === 'true';
        burger.setAttribute('aria-expanded', String(!expanded));
        if (window.innerWidth <= 720){
          if (!expanded) {
            openMobileMenu();
          } else {
            closeMobileMenu();
          }
        }
      });
      
      // Закрытие при клике на overlay (но не на меню)
      overlay.addEventListener('click', (e) => {
        // Закрываем только если клик именно на overlay
        if (e.target === overlay) {
          e.stopPropagation();
          closeMobileMenu();
        }
      });
      
      // Предотвращаем всплытие кликов из меню на overlay
      nav.addEventListener('click', (e) => {
        // Останавливаем всплытие только если это не ссылка
        if (!e.target.closest('.nav-link')) {
          e.stopPropagation();
        }
      });
      
      // Закрытие при свайпе влево (touch события)
      let touchStartX = 0;
      let touchEndX = 0;
      
      nav.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });
      
      nav.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const swipeDistance = touchStartX - touchEndX;
        // Если свайп влево больше 50px, закрываем меню
        if (swipeDistance > 50 && nav.classList.contains('is-open')) {
          closeMobileMenu();
        }
      }, { passive: true });
      
      // Закрытие при клике вне меню (на body) - убрано, чтобы не блокировать клики
      
      // Закрытие при скролле
      let scrollTimeout;
      window.addEventListener('scroll', () => {
        if (window.innerWidth <= 720 && nav.classList.contains('is-open')) {
          clearTimeout(scrollTimeout);
          scrollTimeout = setTimeout(() => {
            closeMobileMenu();
          }, 100);
        }
      }, { passive: true });
      
      // Закрытие при touchmove (листание пальцем)
      let touchMoveTimeout;
      document.addEventListener('touchmove', () => {
        if (window.innerWidth <= 720 && nav.classList.contains('is-open')) {
          clearTimeout(touchMoveTimeout);
          touchMoveTimeout = setTimeout(() => {
            closeMobileMenu();
          }, 150);
        }
      }, { passive: true });
      
      // close on nav link click (mobile)
      $$('.nav-link').forEach(a => {
        a.addEventListener('click', (e) => {
          // Не блокируем клик на ссылку - убираем stopPropagation
          if (window.innerWidth <= 720){
            // Даем ссылке сработать, затем закрываем меню
            setTimeout(() => {
              closeMobileMenu();
            }, 50);
          }
        }, true); // Используем capture phase для приоритета
      });
    }
  
    // Highlight active nav link based on URL
    const path = location.pathname.split('/').pop() || 'index.html';
    $$('.nav-link').forEach(a => {
      const href = a.getAttribute('href');
      if (href === path) a.classList.add('active');
    });
  
    // Smooth page transitions for internal links
    const pageTransition = $('.page-transition');
    function navigateWithTransition(href) {
      if (!pageTransition) { location.href = href; return; }
      // show overlay
      document.body.classList.add('is-loading');
      pageTransition.style.transform = 'translateY(0)';
      setTimeout(() => { location.href = href; }, 260); // short delay before leaving
    }
    $$('a[data-transition]').forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (!href || href.startsWith('http') || a.target === '_blank') return;
        e.preventDefault();
        navigateWithTransition(href);
      });
    });
  
    // Reveal on scroll
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    $$('.reveal').forEach(el => io.observe(el));
  
    // Rotating words
    class Rotator {
      constructor(el) {
        this.el = el;
        try { this.words = JSON.parse(el.getAttribute('data-rotate')); }
        catch { this.words = (el.getAttribute('data-rotate') || '').split(',').map(s => s.trim()); }
        this.index = 0; this.txt = '';
        this.isDeleting = false; this.period = 1400;
        this.tick();
      }
      tick() {
        const full = this.words[this.index % this.words.length] || '';
        this.txt = this.isDeleting ? full.substring(0, this.txt.length - 1) : full.substring(0, this.txt.length + 1);
        this.el.textContent = this.txt;
        let delta = 120 - Math.random() * 60;
        if (this.isDeleting) delta /= 2;
        if (!this.isDeleting && this.txt === full) { delta = this.period; this.isDeleting = true; }
        else if (this.isDeleting && this.txt === '') { this.isDeleting = false; this.index++; delta = 220; }
        setTimeout(() => this.tick(), delta);
      }
    }
    $$('.rotate').forEach(el => new Rotator(el));
  
    // Contact form - обработка перенесена в contact.html
    // Код удален, чтобы избежать конфликтов с обработчиком в contact.html

    // Hide/Show header on scroll
    let lastScrollTop = 0;
    let scrollThreshold = 10;
    const header = document.querySelector('.site-header');
    
    window.addEventListener('scroll', () => {
      let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // Если прокручено меньше 100px, всегда показываем header
      if (scrollTop < 100) {
        header.classList.remove('header-hidden');
        return;
      }
      
      // Скрываем при прокрутке вниз, показываем при прокрутке вверх
      if (Math.abs(scrollTop - lastScrollTop) > scrollThreshold) {
        if (scrollTop > lastScrollTop) {
          // Прокрутка вниз - скрываем
          header.classList.add('header-hidden');
        } else {
          // Прокрутка вверх - показываем
          header.classList.remove('header-hidden');
        }
        lastScrollTop = scrollTop;
      }
    }, { passive: true });

  })();