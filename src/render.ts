import { directions, nav } from './content.ts';
import { icon } from './icons.ts';
import { heroLine, stickerStar, stickerSeal, stickerRibbon, caseStar } from './reference-svg.ts';

const asset = (name: string) => `./assets/${name}`;
const mascot = (name: string, cls = '', alt = '') => `<img class="mascot ${cls}" src="${asset(name)}" alt="${alt}" width="682" height="887" loading="lazy" decoding="async">`;
const wave = (cls = '') => `<svg class="wave ${cls}" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true"><path d="M0 25C260 48 450 130 720 70S1180 6 1440 25V90H0Z"/></svg>`;
const action = (label: string, attrs = '', cls = '') => `<button class="action ${cls}" ${attrs}><span>${label}</span><span class="action-arrow">${icon('arrow')}</span></button>`;
const navLinks = () => nav.map(([href, label]) => `<a href="${href}" data-roll><span>${label}</span><span aria-hidden="true">${label}</span></a>`).join('');
const sticker = (cls: string, shape: string, text: string) => `<div class="hero-sticker ${cls}" data-float>${shape}<span>${text}</span></div>`;

export function renderPage() {
  return `
  <header class="header">
    <div class="header-ribbon">
      <a class="brand" href="#top" aria-label="Надеждик — на главную"><img src="${asset('nadezhdik-logo.svg')}" width="68" height="36" alt="Надеждик"></a>
      <nav class="header-nav" aria-label="Основная навигация">${navLinks()}</nav>
      <button class="header-menu" data-open="menu" aria-label="Открыть меню" aria-haspopup="dialog" aria-controls="menu-dialog">${icon('menu')}</button>
    </div>
    <button class="header-cta" data-open="request">Оставить заявку</button>
  </header>
  <main id="main">
    <section class="hero" id="top" aria-labelledby="hero-title">
      <div class="hero-stage">
        <h1 id="hero-title" class="hero-title" aria-label="Детям интересно расти. Вместе с Надеждиком.">
          <span class="hero-row hero-row-one" aria-hidden="true">Д<span class="elastic-letter letter-e">е</span>тям интересно</span>
          <span class="hero-row hero-row-two" aria-hidden="true">р<span class="elastic-letter letter-a">а</span>сти.</span>
          <span class="hero-row hero-row-three" aria-hidden="true">Вместе с Надеждик<span class="elastic-letter letter-o">о</span>м.</span>
        </h1>
        <div class="hero-route" aria-hidden="true">${heroLine.replace('</svg>', Array.from({length:8},(_,i)=>`<circle class="route-path-dot" data-path-fraction="${[.26,.31,.41,.52,.62,.73,.84,.935][i]}" cx="0" cy="0" r="7"/>`).join('')+'</svg>')}</div>
        ${sticker('sticker-football', stickerStar, 'Футбол<br><b>2–11 лет</b>')}
        ${sticker('sticker-language', '', 'Узнавать<br>новое')}
        ${sticker('sticker-dance', stickerSeal, 'Двигаться<br>и творить')}
        ${sticker('sticker-junior', '', 'Юниор<br><b>12–17 лет</b>')}
        ${sticker('sticker-school', stickerStar, 'Готовиться<br>к школе')}
        ${sticker('sticker-together', stickerRibbon, 'Расти<br>вместе')}
        <div class="hero-penguin" data-float>${mascot('penguin-welcome.webp', '', 'Пингвин Надеждик приветствует вас')}</div>
      </div>
      <p class="hero-description">Спорт, языки и творчество для детей</p>
      ${wave('hero-wave')}
    </section>

    <section class="about" id="about" aria-labelledby="about-title" data-scene="about">
      <div class="about-sticky">
        <div class="about-intro">
          <h2 id="about-title">Помогаем детям<br>открывать мир</h2>
          <div class="about-copy"><p>«Надеждик» объединяет спорт, обучение и творчество. Помогаем детям открывать возможности — в движении, игре и знакомстве с новым.</p><p>Занятия, в которых есть место физическому, познавательному, эмоциональному и социальному развитию.</p></div>
        </div>
        <div class="about-statement" aria-label="Играем в команде. Узнаём мир. Двигаемся смело. Растём вместе.">
          <p><span class="statement-word">Играем</span> <span class="statement-word">в команде.</span> <span class="statement-slot" data-tile-slot="ball"></span></p>
          <p><span class="statement-word">Узнаём</span> <span class="statement-slot" data-tile-slot="globe"></span> <span class="statement-word">мир.</span></p>
          <p><span class="statement-word">Двигаемся</span> <span class="statement-word">смело.</span> <span class="statement-slot" data-tile-slot="music"></span></p>
          <p><span class="statement-slot" data-tile-slot="heart"></span> <span class="statement-word">Растём</span> <span class="statement-word">вместе.</span> <span class="statement-slot" data-tile-slot="book"></span></p>
        </div>
        <div class="about-tiles" aria-hidden="true">${['ball','globe','music','heart','book'].map((name, i) => `<div class="about-tile tile-${i}" data-tile="${name}">${icon(name)}</div>`).join('')}</div>
      </div>
    </section>

    <section class="trust" aria-labelledby="trust-title" data-scene="trust">
      <h2 id="trust-title">Интересно пробовать.<br><span>Здорово получаться.</span></h2>
      <div class="trust-mascot"><div class="mascot-wave-sprite" role="img" aria-label="Надеждик машет крылом"><span class="wave-body"></span><span class="wave-wing"></span></div></div>
      ${action('Найти занятие', 'data-scroll="#directions"', 'trust-action')}
    </section>

    <section class="areas" id="areas" aria-labelledby="areas-title">
      <div class="areas-heading"><h2 class="display-title" id="areas-title">Что интересно<br>вашему ребёнку?</h2>${wave('areas-wave')}</div>
      <div class="area-cards">
        <article class="area-card area-sport"><h3>Спорт</h3><p>Играть, двигаться и быть частью команды. Футбол для детей и подростков.</p><span class="area-detail">Академия футбола · Юниор</span><div class="area-picture"><span class="area-orbit">${icon('ball')}</span>${mascot('football.webp')}</div><button class="pill" data-category="sport">Выбрать футбол</button></article>
        <article class="area-card area-languages"><h3>Языки</h3><p>Знакомиться с миром через новый язык. Английский и китайский.</p><span class="area-detail">Игра, общение, открытия</span><div class="area-picture"><span class="area-orbit">${icon('globe')}</span>${mascot('english.webp')}</div><button class="pill" data-category="languages">Выбрать язык</button></article>
        <article class="area-card area-creative"><h3>Творчество<br>и школа</h3><p>Открывать возможности тела и уверенно готовиться к школьной жизни.</p><span class="area-detail">Хореография · Подготовка к школе</span><div class="area-picture"><span class="area-orbit">${icon('music')}</span>${mascot('dance.webp')}</div><button class="pill" data-category="creative">Узнать о занятиях</button></article>
      </div>
    </section>

    <section class="directions" id="directions" aria-labelledby="directions-title" data-scene="deck">
      <div class="deck-stage">
        <h2 id="directions-title" class="deck-heading">У каждого — свой интерес</h2>
        <div class="deck-background" aria-hidden="true">${caseStar}</div>
        <div class="deck" aria-roledescription="карусель" aria-label="Направления Надеждика" tabindex="0">
          ${directions.map((d,i) => `<article class="direction-card theme-${d.theme}" data-direction-card="${i}" aria-label="${d.title}">
            <div class="direction-front"><span class="spine-title">${d.short}</span><div class="direction-cover"><span class="cover-category">${icon(d.icon)} ${d.age}</span><h3>${d.title}</h3>${mascot(d.image)}<span class="cover-brand">надеждик</span></div></div>
            <div class="direction-back"><span class="direction-count">${String(i+1).padStart(2,'0')} / 06</span><span class="direction-mark">${icon(d.icon)}</span><h3>${d.title}</h3><p>${d.text}</p><span class="direction-age">${d.age}</span><button class="pill" data-open="request" data-direction="${d.id}">Оставить заявку ${icon('arrow')}</button></div>
          </article>`).join('')}
        </div>
        <div class="deck-controls"><button class="circle-button" data-deck-prev aria-label="Предыдущее направление">${icon('left')}</button><span class="deck-position" aria-live="polite">01 / 06</span><button class="circle-button" data-deck-next aria-label="Следующее направление">${icon('right')}</button></div>
        <div class="direction-tabs" role="group" aria-label="Выбрать направление">${directions.map((d,i)=>`<button data-deck-select="${i}" aria-pressed="${i===0}">${d.short}</button>`).join('')}</div>
      </div>
    </section>

    <section class="family" id="family" aria-labelledby="family-title" data-scene="family">
      <div class="family-seam" aria-hidden="true"></div>
      <div class="family-copy"><h2 id="family-title">Мы семья</h2><p>Общаемся и поддерживаем дружеские связи с воспитанниками школ-интернатов Магнитогорска.</p><p>Социальный проект «Надеждика».</p></div>
      <div class="signpost">
        <div class="sign-star" aria-hidden="true">${icon('heart')}</div>
        <a href="#about" class="sign sign-right"><span>Быть рядом</span>${icon('right')}</a>
        <button class="sign sign-left" data-open="request" data-context="Хочу узнать о проекте «Мы семья»"><span>Расти вместе</span>${icon('left')}</button>
      </div>
      ${mascot('penguin-welcome.webp','family-penguin')}
    </section>

    <section class="match" aria-labelledby="match-title" data-scene="match">
      <h2 id="match-title" class="display-title">Подберём<br>занятие вашему<br>ребёнку</h2>
      <div class="interest-tag tag-one" data-float>${icon('ball')}<span>Движение</span><span class="tag-trail"></span></div>
      <div class="interest-tag tag-two" data-float>${icon('globe')}<span>Открытия</span><span class="tag-trail"></span></div>
      <div class="interest-tag tag-three" data-float>${icon('music')}<span>Творчество</span><span class="tag-trail"></span></div>
      <div class="interest-tag tag-four" data-float>${icon('heart')}<span>Общение</span><span class="tag-trail"></span></div>
      <div class="interest-tag tag-five" data-float>${icon('book')}<span>Новые знания</span><span class="tag-trail"></span></div>
      ${action('Помогите выбрать', 'data-open="request" data-context="Нужна помощь с выбором занятия"', 'match-action')}
      ${wave('match-wave')}
    </section>

    <section class="mood" id="request" aria-labelledby="mood-title">
      <h2 id="mood-title" class="display-title">С чего начнём<br>знакомство?</h2><p class="mood-description">Выберите, что вам сейчас ближе.</p>
      <form class="mood-form">
        <fieldset><legend class="sr-only">Ваш следующий шаг</legend>
          ${[['choose','Выбрать занятие','football.webp'],['help','Нужна помощь','penguin-welcome.webp'],['explore','Пока знакомлюсь','english.webp']].map(([v,label,img],i)=>`<label class="mood-option mood-${v}"><span class="mood-disc"><svg viewBox="0 0 240 240" class="mood-ring" aria-hidden="true"><defs><path id="ring-${v}" d="M120 120m-94 0a94 94 0 1 1 188 0a94 94 0 1 1-188 0"/></defs><text><textPath href="#ring-${v}" startOffset="2%">${label} · ${label} · ${label} · </textPath></text></svg>${mascot(img)}</span><span class="mood-option-label">${label}</span><input type="radio" name="mood" value="${v}" ${i===0?'checked':''}><span class="radio-mark">${icon('check')}</span></label>`).join('')}
        </fieldset>
        ${action('Выбрать занятие', 'type="submit"', 'mood-submit')}
      </form>
    </section>
  </main>

  <footer class="footer">
    <div class="marquee" aria-hidden="true"><div class="marquee-track">${Array.from({length:4},()=>`<span>Надеждик</span><span class="marquee-flower">${icon('sun')}</span>`).join('')}</div></div>
    <div class="footer-content"><h2>Расти интересно.<br>Давайте вместе!</h2><nav aria-label="Навигация в подвале">${navLinks()}</nav><div class="footer-contact"><button data-open="request" class="footer-contact-link">Познакомимся? ${icon('arrow')}</button><p>Администратор поможет подобрать группу.<br>Форма на сайте — демонстрационная.</p></div>${mascot('penguin-welcome.webp','footer-penguin')}</div>
    <div class="footer-bottom"><span>© ${new Date().getFullYear()} Надеждик</span><span>Спорт. Языки. Творчество.</span><button data-motion-open>Настройки анимации</button></div>
  </footer>

  <nav class="dock" aria-label="Быстрые действия"><button data-open="menu" aria-haspopup="dialog" aria-controls="menu-dialog"><i></i><span>Открыть: <b>меню</b></span></button><button class="dock-cta" data-open="request">Оставить заявку</button><a href="#directions"><i></i><span>Все <b>занятия</b></span></a></nav>

  <aside class="motion-settings" aria-label="Настройки анимации"><span class="motion-caption">Как вам удобнее?</span><div><button data-motion="full" aria-pressed="true">С движением</button><button data-motion="reduced" aria-pressed="false">Спокойнее</button></div></aside>
  <div class="cursor" aria-hidden="true"><svg viewBox="0 0 28 32"><path d="M1 1 26 17l-13 2-5 12Z"/></svg><span>Вы</span></div>
  <div class="scroll-progress" aria-hidden="true"><span></span></div>

  <dialog id="menu-dialog" class="menu-dialog" aria-label="Меню Надеждика">
    <div class="menu-orbs"><a class="menu-orb orb-left" href="#family"><span class="orb-picture">${mascot('penguin-welcome.webp')}</span><span class="orb-link">${icon('arrow')}<b>Мы семья</b></span></a><div class="menu-orb orb-middle"><nav aria-label="Меню"><a href="#top">Главная</a>${nav.map(([h,l])=>`<a href="${h}">${l}</a>`).join('')}<button data-open="request">Оставить заявку</button></nav><button class="menu-close" data-close="menu">Закрыть ${icon('close')}</button></div><a class="menu-orb orb-right" href="#directions"><span class="orb-picture">${mascot('football.webp')}</span><span class="orb-link">${icon('arrow')}<b>Все занятия</b></span></a></div>
  </dialog>

  <dialog id="request-dialog" class="request-dialog" aria-labelledby="form-title">
    <div class="request-stack"><div class="paper paper-back" aria-hidden="true"></div><div class="paper paper-middle" aria-hidden="true"></div><div class="request-paper">
      <div class="form-heading"><h2 id="form-title">Давайте<br class="mobile-only"> знакомиться</h2><button class="form-close circle-button" data-close="request" aria-label="Закрыть форму">${icon('close')}</button></div>
      <p class="form-note" id="form-note">Это демонстрационная форма. Данные не отправляются и не сохраняются.</p>
      <form id="contact-form" novalidate aria-describedby="form-note">
        <div class="form-grid">
          <label class="field">Ваше имя <span aria-hidden="true">*</span><input name="parentName" autocomplete="name" required placeholder="Как к вам обращаться"><span class="field-error" data-error="parentName"></span></label>
          <label class="field">Телефон <span aria-hidden="true">*</span><input name="phone" type="tel" autocomplete="tel" required placeholder="+7 (___) ___-__-__"><span class="field-error" data-error="phone"></span></label>
          <label class="field">Возраст ребёнка <span class="field-optional">необязательно</span><input name="childAge" inputmode="numeric" placeholder="Например, 5 лет"></label>
          <label class="field field-select">Направление<select name="direction"><option value="">Помогите выбрать</option>${directions.map(d=>`<option value="${d.id}">${d.title}</option>`).join('')}</select></label>
          <label class="field field-message">Комментарий <span class="field-optional">необязательно</span><textarea name="comment" placeholder="Что интересно ребёнку?"></textarea></label>
          <button type="submit" class="form-submit">Проверить заявку ${icon('arrow')}</button>
        </div><p id="form-result" class="form-result" role="status" aria-live="polite"></p>
      </form>
    </div></div>
  </dialog>`;
}
