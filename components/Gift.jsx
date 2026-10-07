'use client';

import { useEffect, useRef, useState } from 'react';
import { CONTENT } from '../lib/content';
import { initFx } from '../lib/fx';

/* заглушка, если файла с фото нет */
const ph = (t) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a0f22"/><stop offset="1" stop-color="#1a0509"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><text x="400" y="310" fill="#e6c27c" font-family="Georgia" font-size="32" text-anchor="middle" opacity=".7">${t}</text></svg>`
  );

export default function Gift() {
  const canvasRef = useRef(null);
  const glowRef = useRef(null);
  const heroRef = useRef(null);
  const fxRef = useRef(null);
  const auRef = useRef(null);
  const eggRef = useRef(null);
  const eggClicks = useRef(0);
  const toastTimer = useRef(null);

  const [veilOn, setVeilOn] = useState(false);
  const [shown, setShown] = useState({});
  const [playing, setPlaying] = useState(false);
  const [toast, setToast] = useState({ text: '', on: false });
  const [psOn, setPsOn] = useState(false);

  /* класс playing на body (в CSS: .playing #music …) */
  useEffect(() => {
    document.body.classList.toggle('playing', playing);
    return () => document.body.classList.remove('playing');
  }, [playing]);

  useEffect(() => {
    const B = document.body;
    const $ = (s) => document.querySelector(s);
    const timers = [];
    const cleanups = [];

    /* частицы */
    const fx = initFx(canvasRef.current);
    fxRef.current = fx;
    cleanups.push(fx.destroy);

    /* появление при скролле */
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        }),
      { threshold: 0.25, rootMargin: '0px 0px -6% 0px' }
    );
    document.querySelectorAll('.rv').forEach((el) => io.observe(el));
    cleanups.push(() => io.disconnect());

    const io2 = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('in'); io2.unobserve(e.target); }
        }),
      { threshold: 0.02 }
    );
    io2.observe($('.paper'));
    cleanups.push(() => io2.disconnect());

    /* таймлайн: пункты раскрываются сами, когда доскроллила */
    const tio = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            const li = e.target;
            timers.push(setTimeout(() => li.classList.add('open'), 700));
            tio.unobserve(li);
          }
        }),
      { threshold: 0.6, rootMargin: '0px 0px -15% 0px' }
    );
    document.querySelectorAll('#tl li').forEach((li) => tio.observe(li));
    cleanups.push(() => tio.disconnect());

    const watch = (sel, th, fn) => {
      const o = new IntersectionObserver(
        (es) => { if (es[0].isIntersecting) { o.disconnect(); fn(); } },
        { threshold: th }
      );
      o.observe($(sel));
      cleanups.push(() => o.disconnect());
    };
    const seq = (a) => a.forEach(([t, f]) => timers.push(setTimeout(f, t)));
    const tg = (id, on) => setShown((s) => ({ ...s, [id]: on }));

    /* параллакс первого экрана */
    const onScroll = () => {
      const y = window.scrollY, h = heroRef.current;
      if (h && y < window.innerHeight * 1.2) {
        h.style.transform = `translateY(${y * 0.25}px)`;
        h.style.opacity = Math.max(0, 1 - y / (window.innerHeight * 0.8));
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    cleanups.push(() => window.removeEventListener('scroll', onScroll));

    /* свечение за курсором */
    if (window.matchMedia('(hover:hover)').matches) {
      const g = glowRef.current;
      g.style.opacity = 1;
      const onMove = (e) => { g.style.transform = `translate(${e.clientX}px,${e.clientY}px)`; };
      window.addEventListener('pointermove', onMove);
      cleanups.push(() => window.removeEventListener('pointermove', onMove));
    }

    /* главный момент */
    watch('#moment', 0.55, () =>
      seq([
        [300, () => tg('m1', true)],
        [4800, () => tg('m1', false)],
        [6200, () => tg('m2', true)],
        [10200, () => tg('m2', false)],
        [11600, () => tg('m3', true)],
        [17500, () => tg('m4', true)],
      ])
    );

    /* финал: салют идёт только пока на экране финал */
    let finaleStarted = false;
    const fo = new IntersectionObserver(
      (es) => {
        const on = es[0].isIntersecting;
        B.classList.toggle('finale', on);
        fx.fireworks(on && finaleStarted);
      },
      { threshold: 0.35 }
    );
    fo.observe($('#finale'));
    cleanups.push(() => { fo.disconnect(); B.classList.remove('finale'); });

    watch('#finale', 0.35, () =>
      seq([
        [1500, () => { finaleStarted = true; tg('f1', true); fx.fireworks(true); fx.volley(3); }],
        [5500, () => tg('f2', true)],
        [9500, () => { tg('f3', true); fx.setMode(1); fx.burst(); fx.volley(8); }],
      ])
    );

    /* музыка: пробуем сразу, иначе — при первом касании */
    const au = new Audio(CONTENT.music);
    au.loop = true;
    au.preload = 'auto';
    auRef.current = au;

    const startMusic = () => {
      if (au.paused) au.play().then(() => setPlaying(true)).catch(() => {});
    };
    startMusic();

    const evts = ['click', 'touchend', 'keydown'];
    const onFirst = (e) => {
      evts.forEach((n) => window.removeEventListener(n, onFirst));
      if (e.target.closest && e.target.closest('#music')) return; // кнопку музыки обработает она сама
      startMusic();
    };
    evts.forEach((n) => window.addEventListener(n, onFirst));

    cleanups.push(() => {
      evts.forEach((n) => window.removeEventListener(n, onFirst));
      au.pause();
    });

    return () => {
      timers.forEach(clearTimeout);
      cleanups.forEach((f) => f());
    };
  }, []);

  const showToast = (text) => {
    setToast({ text, on: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, on: false })), 3200);
  };

  const onOpen = () => {
    setVeilOn(true);
    setTimeout(() => document.getElementById('about').scrollIntoView({ behavior: 'instant' }), 850);
    setTimeout(() => setVeilOn(false), 1000);
  };

  const onMusic = () => {
    const au = auRef.current;
    if (au.paused) {
      au.play().then(() => setPlaying(true)).catch(() => showToast('Добавь файл music/our-song.mp3'));
    } else {
      au.pause();
      setPlaying(false);
    }
  };

  const onEgg = () => {
    const b = eggRef.current;
    b.classList.remove('tap');
    void b.offsetWidth;
    b.classList.add('tap');
    if (++eggClicks.current >= 5) {
      eggClicks.current = 0;
      setPsOn(true);
      fxRef.current.setMode(1);
      fxRef.current.burst(60);
    }
  };

  const sh = (id, base) => base + (shown[id] ? ' show' : '');

  return (
    <>
      <canvas id="fx" ref={canvasRef} />
      <div id="glow" ref={glowRef} />
      <div id="veil" className={veilOn ? 'on' : ''} />
      <button id="music" aria-label="Включить музыку" onClick={onMusic}>
        <span className="eq"><i /><i /><i /></span>
        <span>Наша песня</span>
      </button>
      <button id="egg" ref={eggRef} aria-label="✦" onClick={onEgg}>✦</button>
      <div id="toast" className={toast.on ? 'on' : ''}>{toast.text}</div>

      <main>
        <section id="hero" className="sec full">
          <div className="hero-in" ref={heroRef}>
            <h1>Саша…</h1>
            <p>
              Я долго думал, что подарить тебе на этот день рождения.<br />
              И понял, что хочу подарить тебе кое-что, что останется с тобой немного дольше обычного подарка.
            </p>
            <button id="open" className="btn" onClick={onOpen}>Открыть мой подарок →</button>
          </div>
        </section>

        <section id="about" className="sec full center">
          <h2 className="big rv">Сегодня весь этот маленький мир — только для тебя.</h2>
          <p className="line rv">Для твоей улыбки.</p>
          <p className="line rv">Для твоего смеха.</p>
          <p className="line rv">Для твоих глаз.</p>
          <p className="line rv">Для всех моментов, которые я никогда не хочу забывать.</p>
        </section>

        <section id="photos" className="sec">
          <h2 className="title rv">Мы</h2>
          <div id="gallery" className="collage">
            {CONTENT.photos.map((p, i) => (
              <figure key={i} className={`ph rv i${i}`} style={{ '--d': i * 0.15 + 's' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.src}
                  alt={p.caption}
                  loading="lazy"
                  style={{ objectPosition: p.pos || '50% 50%' }}
                  onError={(e) => {
                    const im = e.currentTarget;
                    im.onerror = null;
                    im.src = ph('Здесь будет ваше фото');
                  }}
                />
                <figcaption>{p.caption}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section id="timeline" className="sec">
          <h2 className="title rv">Наши моменты</h2>
          <ol id="tl">
            {CONTENT.timeline.map((t, i) => (
              <li key={i} className="rv">
                <button onClick={(e) => e.currentTarget.closest('li').classList.toggle('open')}>
                  <span className="dt">{t.date}</span>
                  <b>{t.title}</b>
                </button>
                <div className="tx"><div><p>{t.text}</p></div></div>
              </li>
            ))}
          </ol>
        </section>

        <section id="why" className="sec">
          <h2 className="title rv">Почему именно ты?</h2>
          <p className="hint rv">Нажимай на карточки</p>
          <div id="cards">
            {CONTENT.reasons.map((r, i) => (
              <div
                key={i}
                className="card rv"
                style={{ '--d': (i % 3) * 0.12 + 's' }}
                tabIndex={0}
                onClick={(e) => e.currentTarget.classList.toggle('flip')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); }
                }}
              >
                <div className="in2">
                  <div className="f"><em>{i + 1}</em><small>Почему?</small></div>
                  <div className="b">{r}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="moment" className="sec wide full center dark">
          <div className="stage">
            <p id="m1" className={sh('m1', 'ml')}>Но знаешь, Саша…</p>
            <p id="m2" className={sh('m2', 'ml')}>Я понял одну вещь.</p>
            <p id="m3" className={sh('m3', 'ml')}>
              Мне не нужен особенный день,<br />чтобы понять, как сильно ты мне дорога.
            </p>
            <p id="m4" className={sh('m4', 'ml sm')}>Но сегодня я особенно хочу сказать тебе это.</p>
          </div>
        </section>

        <section id="letter" className="sec">
          <article className="paper">
            <h2>Для тебя ❤️</h2>
            <div id="letterText">
              {CONTENT.letter.map((t, i) => (
                <p key={i} className="rv">{t}</p>
              ))}
              <p className="sig rv">{CONTENT.signature}</p>
            </div>
          </article>
        </section>

        <section id="finale" className="sec wide full center">
          <h2 id="f1" className={sh('f1', 'ml fin')}>С днём рождения, Саша ❤️</h2>
          <p id="f2" className={sh('f2', 'ml')}>Спасибо, что ты есть в моей жизни.</p>
          <p id="f3" className={sh('f3', 'ml fin2')}>Я люблю тебя.</p>
        </section>
      </main>

      <div id="ps" className={psOn ? 'on' : ''} onClick={() => setPsOn(false)}>
        <div className="card-ps">
          <p id="psText">{CONTENT.ps}</p>
          <small>нажми, чтобы закрыть</small>
        </div>
      </div>
    </>
  );
}