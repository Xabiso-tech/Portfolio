(() => {
  const intro = document.querySelector('[data-road-intro]');
  if (!intro) return;

  const continueButton = intro.querySelector('[data-intro-continue]');
  const skipButton = intro.querySelector('[data-intro-skip]');
  const message = intro.querySelector('[data-intro-message]');
  const title = intro.querySelector('#intro-title');
  const controls = [continueButton, skipButton];
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let ignitionStarted = false;
  let introTimeline = null;

  const rememberVisit = () => {
    try { sessionStorage.setItem('dev-road-intro-seen', 'yes'); } catch (_) { /* Storage may be disabled. */ }
  };

  const finishIntro = () => {
    introTimeline?.kill();
    introTimeline = null;
    rememberVisit();
    intro.hidden = true;
    intro.classList.remove('is-ready', 'is-leaving', 'is-ignited');
    document.body.classList.remove('intro-is-open');
    document.querySelector('#driver-title')?.focus({ preventScroll: true });
  };

  const closeIntro = () => {
    introTimeline?.kill();
    introTimeline = null;
    rememberVisit();
    intro.classList.add('is-leaving');
    window.setTimeout(finishIntro, motionPreference.matches ? 0 : 420);
  };

  const startJourney = () => {
    if (motionPreference.matches) {
      finishIntro();
      return;
    }

    if (window.gsap) {
      introTimeline = window.gsap.timeline({ onComplete: finishIntro });
      introTimeline
        .to('.intro-dash-light', {
          backgroundColor: '#ffd447',
          boxShadow: '0 0 16px 5px #ffd447',
          duration: 0.22,
          stagger: 0.14,
          ease: 'power1.out'
        }, 0)
        .to('.intro-windshield', {
          scale: 1.04,
          filter: 'brightness(1.3) saturate(1.15)',
          duration: 0.9,
          ease: 'power2.inOut'
        }, 0.12)
        .to('.intro-road', {
          scaleY: 1.5,
          duration: 0.9,
          ease: 'power2.in'
        }, 0.16)
        .to('.intro-dash', {
          yPercent: 18,
          filter: 'brightness(1.4)',
          duration: 0.85,
          ease: 'power2.in'
        }, 0.12)
        .to(intro, {
          autoAlpha: 0,
          scale: 1.025,
          duration: 0.4,
          ease: 'power1.in'
        }, 0.82);
      return;
    }

    intro.classList.add('is-ignited');
    window.setTimeout(finishIntro, 1250);
  };

  continueButton.addEventListener('click', () => {
    if (!ignitionStarted) {
      ignitionStarted = true;
      intro.dataset.scene = 'ignition';
      title.innerHTML = 'The dashboard<br>comes alive.';
      message.textContent = 'The road ahead is yours to explore. Ready when you are.';
      continueButton.textContent = 'Start the journey';
      return;
    }
    startJourney();
  });

  skipButton.addEventListener('click', closeIntro);

  intro.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeIntro();
      return;
    }
    if (event.key === 'Tab') {
      const activeIndex = controls.indexOf(document.activeElement);
      if (event.shiftKey && activeIndex === 0) {
        event.preventDefault();
        controls[controls.length - 1].focus();
      } else if (!event.shiftKey && activeIndex === controls.length - 1) {
        event.preventDefault();
        controls[0].focus();
      }
    }
  });

  let hasSeenIntro = false;
  try { hasSeenIntro = sessionStorage.getItem('dev-road-intro-seen') === 'yes'; } catch (_) { /* Storage may be disabled. */ }

  if (!hasSeenIntro && !motionPreference.matches) {
    intro.hidden = false;
    document.body.classList.add('intro-is-open');
    window.requestAnimationFrame(() => {
      intro.classList.add('is-ready');
      skipButton.focus({ preventScroll: true });
    });
  }
})();
