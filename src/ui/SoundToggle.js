/* ==========================================================
   TECH'STAMENT — THE SOUND CONTROL

   The room tone is synthesised in the browser, so there is no
   audio file to load and nothing to autoplay. The visitor turns
   the sound on, and it stays on for the rest of the visit.

   The control appears twice: once in the introduction and once in
   the reading toolbar, because the introduction fades away and the
   reader should not have to go back to find the switch.

   Every button reports the state honestly through `aria-pressed`,
   and the little speaker waves only appear when the sound is
   genuinely running.
   ========================================================== */

export function bindSoundToggle({
  button,
  buttons,
  sound,
  labelSelector = '[data-sound-label]',
}) {
  /* One button or several: the caller may pass either. */
  const targets = (buttons || (button ? [button] : [])).filter(Boolean);

  if (!targets.length) return { update: () => {} };

  const labels = targets.map((target) => target.querySelector(labelSelector));

  const update = () => {
    const on = sound.enabled;

    targets.forEach((target, index) => {
      target.setAttribute('aria-pressed', on ? 'true' : 'false');
      target.setAttribute(
        'aria-label',
        on ? 'Turn sound off' : 'Turn sound on'
      );

      const label = labels[index];
      if (label) label.textContent = on ? 'SOUND ON' : 'SOUND OFF';
    });
  };

  targets.forEach((target) => {
    target.addEventListener('click', async () => {
      /* The sound can only start from a real gesture, so this is
         also where the audio context is created. */
      await sound.toggle();
      update();

      if (sound.enabled) {
        sound.play('chime');
      }
    });
  });

  update();

  return { update };
}
