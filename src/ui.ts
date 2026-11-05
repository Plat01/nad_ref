import { directions } from './content.ts';
import { icon } from './icons.ts';

const emit = (name: string, detail: unknown) => window.dispatchEvent(new CustomEvent(`nadezhdik:${name}`, { detail }));

export function initUI() {
  const menu = document.querySelector<HTMLDialogElement>('#menu-dialog')!;
  const request = document.querySelector<HTMLDialogElement>('#request-dialog')!;
  const form = document.querySelector<HTMLFormElement>('#contact-form')!;
  const result = document.querySelector<HTMLElement>('#form-result')!;
  let active: HTMLDialogElement | null = null;
  let opener: HTMLElement | null = null;
  let transition = false;

  function clearForm() {
    form.reset(); result.textContent = '';
    form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
    form.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  }

  function closeModal(restore = true) {
    return new Promise<void>(resolve => {
      if (!active) { resolve(); return; }
      const dialog = active;
      dialog.classList.remove('is-open');
      transition = true;
      setTimeout(() => {
        dialog.close();
        if (dialog === request) clearForm();
        active = null; transition = false;
        document.body.classList.remove('modal-open');
        document.querySelectorAll('[aria-controls="menu-dialog"]').forEach(el => el.setAttribute('aria-expanded', 'false'));
        emit('modal', false);
        if (restore && opener?.isConnected && opener.getClientRects().length) opener.focus({ preventScroll: true });
        resolve();
      }, document.documentElement.classList.contains('reduced-motion') ? 0 : 450);
    });
  }

  async function openModal(name: string, trigger: HTMLElement) {
    if (transition) return;
    const next = name === 'menu' ? menu : request;
    const nextOpener = active ? opener : trigger;
    if (active) await closeModal(false);
    opener = nextOpener;
    if (next === request) {
      clearForm();
      const selected = form.elements.namedItem('direction') as HTMLSelectElement;
      const direction = trigger.dataset.direction;
      if (direction && directions.some(d => d.id === direction)) selected.value = direction;
      const comment = form.elements.namedItem('comment') as HTMLTextAreaElement;
      comment.value = trigger.dataset.context || '';
    }
    active = next;
    document.body.classList.add('modal-open');
    next.showModal();
    emit('modal', true);
    document.querySelectorAll('[aria-controls="menu-dialog"]').forEach(el => el.setAttribute('aria-expanded', String(next === menu)));
    requestAnimationFrame(() => next.classList.add('is-open'));
  }

  document.addEventListener('click', async event => {
    const target = event.target as Element;
    const open = target.closest<HTMLElement>('[data-open]');
    if (open) { event.preventDefault(); await openModal(open.dataset.open!, open); return; }
    if (target.closest('[data-close]')) { event.preventDefault(); await closeModal(); return; }
    const scrollButton = target.closest<HTMLElement>('[data-scroll]');
    if (scrollButton) { emit('scroll', scrollButton.dataset.scroll); return; }
    const category = target.closest<HTMLElement>('[data-category]');
    if (category) {
      const direction = directions.find(d => d.category === category.dataset.category)!;
      emit('scroll', '#directions');
      // The desktop fan updates directly; the phone flipbook scrolls to its chapter.
      emit('deckselect', direction.id);
      return;
    }
    const anchor = target.closest<HTMLAnchorElement>('a[href^="#"]');
    if (anchor) {
      const hash = anchor.getAttribute('href')!;
      if (!document.querySelector(hash)) return;
      event.preventDefault();
      if (active) await closeModal(false);
      history.replaceState(null, '', hash);
      emit('scroll', hash);
      const destination = document.querySelector<HTMLElement>(hash)!;
      destination.setAttribute('tabindex', '-1');
      destination.focus({ preventScroll: true });
    }
  });

  [menu, request].forEach(dialog => {
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab' || !dialog.open) return;
      const focusable = [...dialog.querySelectorAll<HTMLElement>('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(element => !element.hasAttribute('disabled') && element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    });
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeModal(); });
    dialog.addEventListener('click', event => { if (event.target === dialog) closeModal(); });
    dialog.addEventListener('close', () => {
      if (active === dialog && !transition) {
        active = null; document.body.classList.remove('modal-open'); emit('modal', false);
        if (dialog === request) clearForm();
      }
    });
  });

  const moodForm = document.querySelector<HTMLFormElement>('.mood-form')!;
  const moodButton = document.querySelector<HTMLButtonElement>('.mood-submit')!;
  const moodText: Record<string, string> = { choose: 'Выбрать занятие', help: 'Помогите выбрать', explore: 'Посмотреть занятия' };
  function getMood() { return (moodForm.querySelector<HTMLInputElement>('input[name="mood"]:checked')!).value; }
  moodForm.addEventListener('change', () => { moodButton.querySelector('span')!.textContent = moodText[getMood()]; });
  moodForm.addEventListener('submit', event => {
    event.preventDefault();
    const mood = getMood();
    if (mood === 'explore') { emit('scroll', '#directions'); return; }
    moodButton.dataset.context = mood === 'help' ? 'Нужна помощь с выбором занятия' : 'Хочу подобрать занятие ребёнку';
    openModal('request', moodButton);
  });

  function setError(name: string, message: string) {
    const input = form.elements.namedItem(name) as HTMLInputElement;
    const error = form.querySelector<HTMLElement>(`[data-error="${name}"]`)!;
    error.id = `error-${name}`;
    error.textContent = message;
    if (message) { input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', error.id); }
    else { input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby'); }
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const name = (form.elements.namedItem('parentName') as HTMLInputElement).value.trim();
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value.replace(/\D/g, '');
    setError('parentName', name.length < 2 ? 'Укажите имя — хотя бы 2 символа.' : '');
    setError('phone', phone.length < 10 || phone.length > 15 ? 'Укажите телефон: от 10 до 15 цифр с кодом страны.' : '');
    const invalid = form.querySelector<HTMLInputElement>('[aria-invalid="true"]');
    if (invalid) { result.textContent = ''; invalid.focus(); return; }
    result.innerHTML = `${icon('check')}<span>Проверка пройдена. Это демонстрация: заявка не отправлена, данные не сохранены.</span>`;
  });
  form.addEventListener('input', event => {
    const input = event.target as HTMLInputElement;
    if (input.name === 'parentName' || input.name === 'phone') setError(input.name, '');
    result.textContent = '';
  });

  const settings = document.querySelector<HTMLElement>('.motion-settings')!;
  const systemMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let preference: string | null = null;
  try { preference = localStorage.getItem('nadezhdik-motion'); } catch { /* Private browsing still works. */ }
  let reduced = preference ? preference === 'reduced' : systemMotion.matches;
  function updateSettings() {
    document.documentElement.classList.toggle('reduced-motion', reduced);
    document.querySelectorAll<HTMLElement>('[data-motion]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.motion === (reduced ? 'reduced' : 'full'))));
  }
  if (preference) settings.classList.add('is-dismissed');
  updateSettings();
  document.querySelectorAll<HTMLElement>('[data-motion]').forEach(button => button.addEventListener('click', () => {
    preference = button.dataset.motion!;
    reduced = preference === 'reduced';
    try { localStorage.setItem('nadezhdik-motion', preference); } catch { /* Setting remains in memory. */ }
    updateSettings(); emit('motionchange', reduced);
    settings.classList.add('is-dismissed');
    settings.classList.remove('is-floating');
  }));
  document.querySelector('[data-motion-open]')!.addEventListener('click', () => {
    settings.classList.remove('is-dismissed');
    settings.classList.add('is-floating');
    settings.querySelector<HTMLElement>('button')!.focus({ preventScroll: true });
  });
  systemMotion.addEventListener('change', event => {
    if (preference) return;
    reduced = event.matches; updateSettings(); emit('motionchange', reduced);
  });
  return reduced;
}
