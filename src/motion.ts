import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import Lenis from 'lenis';
import { directions } from './content.ts';

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

export function initMotion(initialReduced: boolean) {
  const root = document.documentElement;
  const deck = document.querySelector<HTMLElement>('.deck')!;
  const cards = [...document.querySelectorAll<HTMLElement>('[data-direction-card]')];
  let reduced = initialReduced;
  let current = 0;
  let media: gsap.MatchMedia | undefined;
  let context: gsap.Context | undefined;
  let lenis: Lenis | undefined;
  let mobileTrigger: ScrollTrigger | undefined;
  let mobileTimeline: gsap.core.Timeline | undefined;
  let loopObserver: IntersectionObserver | undefined;
  const loops = new Map<Element, gsap.core.Animation[]>();
  const visible = new Set<Element>();
  let rafTick: ((time: number) => void) | undefined;

  const updateAccessibleState = (index: number) => {
    current = ((index % cards.length) + cards.length) % cards.length;
    const position = `${String(current + 1).padStart(2, '0')} / 06`;
    document.querySelector('.deck-position')!.textContent = position;
    cards.forEach((card, i) => {
      const active = i === current;
      card.classList.toggle('is-active', active);
      card.setAttribute('aria-hidden', String(!reduced && !active));
      card.querySelectorAll<HTMLElement>('button').forEach(b => b.tabIndex = !reduced && !active ? -1 : 0);
    });
    document.querySelectorAll<HTMLElement>('[data-deck-select]').forEach((button, i) => button.setAttribute('aria-pressed', String(i === current)));
  };

  function renderDesktopDeck(index: number, immediate = false) {
    updateAccessibleState(index);
    const width = window.innerWidth <= 991 ? innerWidth * .8 : window.innerWidth <= 1200 ? innerWidth * .6 : Math.min(innerWidth * .53, 780);
    const spacing = Math.min(60, window.innerWidth * .042);
    cards.forEach((card, i) => {
      const delta = ((i - current + cards.length + Math.floor(cards.length / 2)) % cards.length) - Math.floor(cards.length / 2);
      const distance = Math.abs(delta);
      const x = delta === 0 ? 0 : Math.sign(delta) * (width * .27 + distance * spacing);
      card.classList.toggle('side-left', delta < 0);
      card.classList.toggle('side-right', delta > 0);
      gsap.set(card, { zIndex: 30 - distance, visibility: 'visible' });
      const props = {
        xPercent: -50, yPercent: -50,
        x, y: distance * 8, rotationY: 0, transformPerspective: 0,
        width: delta === 0 ? width : width * .5,
        rotationX: 0, scaleX: 1, scaleY: 1 - Math.min(distance * .025, .12),
        autoAlpha: 1, duration: .7, ease: 'power3.out', overwrite: 'auto' as const,
      };
      immediate ? gsap.set(card, props) : gsap.to(card, props);
    });
  }

  function scrollToY(y: number, immediate = false) {
    if (lenis) lenis.scrollTo(y, { immediate, duration: immediate ? 0 : 1.15 });
    else window.scrollTo({ top: y, behavior: reduced || immediate ? 'instant' : 'smooth' });
  }

  function selectDeck(index: number, moveScroll = true) {
    const next = (index + cards.length) % cards.length;
    if (reduced) {
      updateAccessibleState(next);
      if (moveScroll) cards[next].scrollIntoView({ block: 'center', behavior: 'instant' });
      return;
    }
    if (window.innerWidth >= 768) renderDesktopDeck(next);
    else if (mobileTrigger && mobileTimeline) {
      const stopTime = next === cards.length - 1 ? mobileTimeline.duration() : next;
      const progress = stopTime / mobileTimeline.duration();
      scrollToY(mobileTrigger.start + progress * (mobileTrigger.end - mobileTrigger.start));
    }
  }

  document.querySelector('[data-deck-prev]')!.addEventListener('click', () => selectDeck(current - 1));
  document.querySelector('[data-deck-next]')!.addEventListener('click', () => selectDeck(current + 1));
  document.querySelectorAll<HTMLElement>('[data-deck-select]').forEach(button => button.addEventListener('click', () => selectDeck(Number(button.dataset.deckSelect))));
  deck.addEventListener('keydown', event => {
    const index = event.key === 'ArrowRight' ? current + 1 : event.key === 'ArrowLeft' ? current - 1 : event.key === 'Home' ? 0 : event.key === 'End' ? cards.length - 1 : null;
    if (index !== null) { event.preventDefault(); selectDeck(index); }
  });

  let startX = 0;
  let startY = 0;
  let downTarget: Element | null = null;
  let dragging = false;
  let pointerId = -1;
  deck.addEventListener('pointerdown', event => {
    if (reduced || dragging || (event.target as Element).closest('button,a')) return;
    startX = event.clientX; startY = event.clientY; dragging = true;
    pointerId = event.pointerId;
    downTarget = event.target as Element;
    deck.setPointerCapture(event.pointerId);
  });
  deck.addEventListener('pointerup', event => {
    if (!dragging || event.pointerId !== pointerId) return;
    dragging = false;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) selectDeck(current + (dx < 0 ? 1 : -1));
    else if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && window.innerWidth >= 768) {
      const targetCard = downTarget?.closest<HTMLElement>('[data-direction-card]');
      if (targetCard) selectDeck(Number(targetCard.dataset.directionCard), false);
    }
  });
  deck.addEventListener('pointercancel', () => dragging = false);
  deck.addEventListener('lostpointercapture', () => dragging = false);
  window.addEventListener('blur', () => dragging = false);
  deck.addEventListener('wheel', event => {
    if (Math.abs(event.deltaX) > 25 && Math.abs(event.deltaX) > Math.abs(event.deltaY) && !reduced) {
      event.preventDefault(); selectDeck(current + (event.deltaX > 0 ? 1 : -1));
    }
  }, { passive: false });

  window.addEventListener('nadezhdik:deckselect', event => {
    const id = (event as CustomEvent<string>).detail;
    const index = directions.findIndex(d => d.id === id);
    if (index >= 0) selectDeck(index);
  });
  window.addEventListener('nadezhdik:scroll', event => {
    const selector = (event as CustomEvent<string>).detail;
    const element = document.querySelector<HTMLElement>(selector);
    if (element) scrollToY(element.getBoundingClientRect().top + window.scrollY);
  });
  window.addEventListener('nadezhdik:modal', event => {
    const isOpen = (event as CustomEvent<boolean>).detail;
    if (isOpen) lenis?.stop(); else lenis?.start();
  });

  function fitHero() {
    const stage = document.querySelector<HTMLElement>('.hero-stage')!;
    const rows = [...document.querySelectorAll<HTMLElement>('.hero-row')];
    rows.forEach((row, i) => {
      row.style.setProperty('--row-scale', '1');
      if (window.innerWidth < 768 && i !== 1) return;
      const fraction = window.innerWidth < 768 ? .4 : [.9, .31, .99][i];
      row.style.setProperty('--row-scale', String(stage.clientWidth * fraction / row.offsetWidth));
    });
  }

  function manageLoop(element: Element, animation: gsap.core.Animation) {
    animation.pause();
    loops.set(element, [...(loops.get(element) || []), animation]);
    loopObserver?.observe(element);
  }
  const visibility = () => loops.forEach((animations, el) => animations.forEach(animation => {
    document.hidden || !visible.has(el) ? animation.pause() : animation.resume();
  }));
  document.addEventListener('visibilitychange', visibility);

  function setup(isReduced: boolean) {
    gsap.killTweensOf(cards);
    media?.revert(); context?.revert(); loopObserver?.disconnect();
    gsap.set(cards, { clearProps: 'transform,opacity,visibility,width,zIndex' });
    loops.clear(); visible.clear();
    if (rafTick) gsap.ticker.remove(rafTick);
    lenis?.destroy(); lenis = undefined;
    mobileTrigger = undefined; mobileTimeline = undefined;
    reduced = isReduced;
    root.classList.toggle('reduced-motion', reduced);
    root.classList.toggle('has-motion', !reduced);
    root.classList.toggle('has-custom-cursor', !reduced && matchMedia('(pointer:fine)').matches && window.innerWidth >= 768);
    deck.tabIndex = reduced ? -1 : 0;
    if (reduced) deck.removeAttribute('aria-roledescription');
    else deck.setAttribute('aria-roledescription', 'карусель');
    fitHero();
    updateAccessibleState(current);
    if (reduced) return;

    loopObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
      visibility();
    }, { threshold: 0 });

    if (matchMedia('(pointer:fine)').matches) {
      lenis = new Lenis({
        duration: 1.5,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true, wheelMultiplier: .4, autoRaf: false,
        anchors: true,
      });
      lenis.on('scroll', ScrollTrigger.update);
      rafTick = (time: number) => lenis?.raf(time * 1000);
      gsap.ticker.add(rafTick);
      gsap.ticker.lagSmoothing(0);
    }

    context = gsap.context(() => {
      const hero = document.querySelector('.hero')!;
      const path = document.querySelector<SVGPathElement>('#draw-path')!;
      const penPath = document.querySelector<SVGPathElement>('#pen-path')!;
      const length = path.getTotalLength();
      gsap.from('.hero-row', { y: 45, opacity: .25, stagger: .12, duration: 1, ease: 'power4.out', clearProps: 'transform,opacity' });
      gsap.from('.header', { y: -30, opacity: 0, duration: .7, delay: .3, ease: 'power3.out' });
      gsap.from('.dock', { y: 120, autoAlpha: 0, duration: .8, delay: .8, ease: 'power3.out' });
      gsap.from('.hero-sticker,.hero-penguin', { scale: .5, autoAlpha: 0, duration: .45, stagger: .12, delay: .55, ease: 'back.out(2)' });
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
      const drawing = gsap.timeline();
      document.querySelectorAll<SVGCircleElement>('.route-path-dot').forEach(circle => {
        const point = path.getPointAtLength(length * Number(circle.dataset.pathFraction));
        circle.setAttribute('cx', String(point.x));
        circle.setAttribute('cy', String(point.y));
      });
      drawing.to(path, { strokeDashoffset: 0, duration: 7.5, ease: 'power2.out' }, 0);
      drawing.to('#line-pen', { motionPath: { path: penPath, align: penPath, autoRotate: 90, alignOrigin: [0, 1] }, transformOrigin: '0% 100%', duration: 7.5, ease: 'power2.out' }, 0);
      manageLoop(hero, gsap.to('.elastic-letter', { scaleX: 1.12, rotation: '+=5', duration: 1.4, stagger: .2, repeat: -1, yoyo: true, ease: 'power2.inOut' }));
      document.querySelectorAll<HTMLElement>('.hero [data-float]').forEach((el, i) => {
        manageLoop(hero, gsap.to(el, { y: i % 2 ? 8 : -8, rotation: '+=3', duration: 2.3 + i * .15, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 1 + i * .15 }));
      });

      const tiles = [...document.querySelectorAll<HTMLElement>('.about-tile')];
      const sticky = document.querySelector<HTMLElement>('.about-sticky')!;
      const destination = (tile: HTMLElement) => {
        const slot = document.querySelector<HTMLElement>(`[data-tile-slot="${tile.dataset.tile}"]`)!;
        const slotRect = slot.getBoundingClientRect();
        const stageRect = sticky.getBoundingClientRect();
        return {
          x: slotRect.left - stageRect.left + slotRect.width / 2 - tile.offsetLeft - tile.offsetWidth / 2,
          y: slotRect.top - stageRect.top + slotRect.height / 2 - tile.offsetTop - tile.offsetHeight / 2,
          scale: slot.offsetWidth / tile.offsetWidth,
        };
      };
      gsap.set('.statement-word', { autoAlpha: 0 });
      const aboutTimeline = gsap.timeline({ scrollTrigger: { trigger: '.about', start: 'top top', end: 'bottom bottom', scrub: 1.2, invalidateOnRefresh: true } });
      aboutTimeline.to('.about-intro', { y: -100, autoAlpha: 0, duration: .4, ease: 'power2.in' }, .15);
      tiles.forEach((tile, i) => aboutTimeline.to(tile, {
        x: () => destination(tile).x, y: () => destination(tile).y, scale: () => destination(tile).scale,
        rotation: 0, duration: .55, ease: 'power2.inOut',
      }, .35 + i * .05));
      aboutTimeline.fromTo('.statement-word', { x: i => i % 2 ? 50 : -50 }, { x: 0, autoAlpha: 1, duration: .35, stagger: .055, ease: 'power1.out' }, .8).to({}, { duration: .3 });

      const trustTrigger = { trigger: '.trust', start: 'top 60%', end: 'top top', scrub: 1.2, invalidateOnRefresh: true };
      gsap.from('.trust-mascot', { scale: .45, ease: 'none', scrollTrigger: trustTrigger });
      gsap.from('.trust h2', { xPercent: 30, y: 80, ease: 'none', scrollTrigger: trustTrigger });
      gsap.from('.trust-action', { xPercent: -30, y: 80, ease: 'none', scrollTrigger: trustTrigger });
      manageLoop(document.querySelector('.trust')!, gsap.to('.wave-wing', { rotation: -32, duration: .65, repeat: -1, yoyo: true, repeatDelay: .15, ease: 'power2.inOut' }));

      document.querySelectorAll<HTMLElement>('.area-orbit').forEach((el, i) => manageLoop(el.closest('.area-card')!, gsap.to(el, { rotation: '+=360', duration: 18 + i * 2, repeat: -1, ease: 'none' })));
      gsap.to('.deck-background svg', { rotation: 180, ease: 'none', scrollTrigger: { trigger: '.directions', start: 'top bottom', end: 'bottom top', scrub: 1.2 } });
      gsap.to('.sign-right', { rotationY: -25, duration: 1, ease: 'back.out(1.7)', scrollTrigger: { trigger: '.family', start: 'top 45%', toggleActions: 'play none none reverse' } });
      gsap.to('.sign-left', { rotationY: 25, duration: 1, delay: .1, ease: 'back.out(1.7)', scrollTrigger: { trigger: '.family', start: 'top 45%', toggleActions: 'play none none reverse' } });
      gsap.from('.family-penguin', { y: 120, rotation: -12, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.family', start: 'top 40%', toggleActions: 'play none none reverse' } });

      const tags = document.querySelectorAll<HTMLElement>('.interest-tag');
      const tagIntro = gsap.timeline({ scrollTrigger: { trigger: '.match', start: 'top 50%', end: '80% 50%', toggleActions: 'play reverse play reverse' } });
      tags.forEach((tag, i) => {
        tagIntro.from(tag, { autoAlpha: 0, scale: .5, duration: .6, ease: 'power2.out' }, i * .15);
        tagIntro.from(tag.querySelector('.tag-trail'), { scaleX: 0, transformOrigin: 'left', duration: .8, ease: 'power1.out' }, i * .15 + .3);
        manageLoop(document.querySelector('.match')!, gsap.to(tag, { y: i % 2 ? 7 : -7, rotation: '+=3', duration: 2.5 + i * .15, repeat: -1, yoyo: true, ease: 'sine.inOut' }));
      });
      manageLoop(document.querySelector('.marquee')!, gsap.to('.marquee-track', { xPercent: -50, duration: 22, repeat: -1, ease: 'none' }));
      document.querySelectorAll('.mood-ring').forEach((ring, i) => manageLoop(document.querySelector('.mood')!, gsap.to(ring, { rotation: i % 2 ? -360 : 360, duration: 35, repeat: -1, ease: 'none' })));

      gsap.utils.toArray<HTMLElement>('.areas-heading h2,.match h2,.mood h2,.family-copy,.footer-content h2').forEach(element => {
        gsap.from(element, { y: 40, clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'power4.out', scrollTrigger: { trigger: element, start: 'top 92%', once: true } });
      });
      ScrollTrigger.create({ start: 0, end: 'max', onUpdate: self => gsap.set('.scroll-progress', { y: self.progress * (innerHeight - 100) }) });
    });

    media = gsap.matchMedia();
    media.add('(min-width: 768px)', () => {
      renderDesktopDeck(current, true);
      gsap.from('.area-card', { yPercent: i => [55, 50, 65][i], ease: 'none', scrollTrigger: { trigger: '.area-cards', start: 'top bottom', end: 'top 46%', scrub: 1.2, invalidateOnRefresh: true } });
      const resizeDeck = () => renderDesktopDeck(current, true);
      ScrollTrigger.addEventListener('refreshInit', resizeDeck);
      return () => ScrollTrigger.removeEventListener('refreshInit', resizeDeck);
    });
    media.add('(max-width: 767px)', () => {
      gsap.set(cards, { clearProps: 'width', xPercent: -50, yPercent: -50, x: 0, y: i => i * 8, rotationX: 0, rotationY: 0, transformPerspective: 0, scale: 1, autoAlpha: 1, zIndex: i => 30 - i });
      const timeline = gsap.timeline({ scrollTrigger: {
        trigger: '.directions', start: 'top top', end: 'bottom bottom', scrub: .6, invalidateOnRefresh: true,
      } });
      timeline.eventCallback('onUpdate', () => updateAccessibleState(Math.min(cards.length - 1, Math.floor(timeline.time() + .5))));
      cards.slice(0, -1).forEach((card, i) => {
        timeline.to(card, { rotationX: -180, y: -30, duration: .7, ease: 'power1.inOut' }, i + .15);
        timeline.set(card, { autoAlpha: 0 }, i + .5);
        timeline.to(cards.slice(i + 1), { y: j => j * 8, duration: .7, ease: 'power2.out' }, i + .15);
      });
      timeline.to({}, { duration: .3 });
      mobileTimeline = timeline; mobileTrigger = timeline.scrollTrigger;
      document.querySelectorAll<HTMLElement>('.area-card').forEach(card => gsap.from(card, { y: 60, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 92%', once: true } }));
      return () => { mobileTrigger = undefined; mobileTimeline = undefined; };
    });
    ScrollTrigger.refresh();
  }

  const cursor = document.querySelector<HTMLElement>('.cursor')!;
  const cursorLabel = cursor.querySelector('span')!;
  const xTo = gsap.quickTo(cursor, 'x', { duration: .12, ease: 'power2.out' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: .12, ease: 'power2.out' });
  window.addEventListener('pointermove', event => {
    if (reduced || event.pointerType === 'touch') return;
    xTo(event.clientX); yTo(event.clientY);
    const target = event.target as Element;
    cursor.style.opacity = target.closest('input,textarea,select') ? '0' : '1';
    cursorLabel.textContent = target.closest('a,button,label') ? 'Нажать' : target.closest('.deck') ? 'Потянуть' : 'Вы';
  }, { passive: true });
  window.addEventListener('nadezhdik:motionchange', event => setup((event as CustomEvent<boolean>).detail));
  let resizeTimeout: ReturnType<typeof setTimeout>;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      root.classList.toggle('has-custom-cursor', !reduced && matchMedia('(pointer:fine)').matches && innerWidth >= 768);
      fitHero(); ScrollTrigger.refresh();
    }, 150);
  }, { passive: true });
  setup(initialReduced);
}
