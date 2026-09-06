import './style.css';
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <canvas id="scene" aria-label="First-person walk through the abandoned Meridian Galleria"></canvas>
  <div id="atmosphere" aria-hidden="true"></div>
  <div id="hud" hidden>
    <div class="hud-brand">Meridian <small>OCTOBER · 2004</small></div>
    <div class="location"><span id="zone">Main entrance</span><small id="floor">LEVEL 1</small></div>
    <div id="interaction-prompt" hidden><kbd>E</kbd><span></span></div><div id="feedback" role="status" aria-live="polite" hidden></div><span class="dot"></span><span class="hint">WASD — walk &nbsp; · &nbsp; SHIFT — run &nbsp; · &nbsp; MOUSE — look around &nbsp; · &nbsp; E — interact &nbsp; · &nbsp; ESC — pause</span>
  </div>
  <section id="overlay" aria-label="Main menu">
    <header class="masthead"><div class="wordmark"><i class="symbol" aria-hidden="true"></i>MERIDIAN GALLERIA</div><span>October 2004 &nbsp; / &nbsp; 8:17 PM</span></header>
    <main class="intro">
      <p class="eyebrow" id="eyebrow">AFTER HOURS</p>
      <h1>Meridian<span>,<br>2004</span></h1>
      <p class="description" id="description">The doors are closed. The lights are still on.<br>Take your time. There’s nowhere to be.</p>
      <button class="primary" id="enter" disabled><span id="enter-label">Opening the doors…</span><span class="arrow" aria-hidden="true">↗</span></button>
      <div class="menu-actions"><button class="secondary" id="reset" hidden>Return to the entrance</button><button class="secondary" id="sound-settings" disabled>Sound & settings</button></div>
      <p id="status" role="status" aria-live="polite"></p>
    </main>
    <footer class="footer"><div class="controls"><div><b>W A S D / ↑ ← ↓ →</b>Walk</div><div><b>SHIFT</b>Run · 2.5×</div><div><b>MOUSE</b>Look around</div><div><b>E</b>Read / interact</div><div><b>ESC</b>Pause</div></div><div class="edition">A PLACE YOU ALMOST REMEMBER<br>Est. 1992 · Meridian Galleria</div></footer>
  </section>
  <dialog id="settings-dialog" aria-labelledby="settings-title">
    <p class="eyebrow">MAKE YOURSELF COMFORTABLE</p><h2 id="settings-title" tabindex="-1">Sound & settings</h2>
    <p class="panel-note">Headphones bring the empty rooms closer.</p>
    <label class="setting" for="volume">Master volume <output id="volume-value" for="volume"></output><input id="volume" type="range" min="0" max="100" step="1"></label>
    <label class="check"><input id="muted" type="checkbox"> Mute all sound</label>
    <label class="check"><input id="music" type="checkbox"> Ambient music</label>
    <label class="setting" for="sensitivity">Mouse sensitivity <output id="sensitivity-value" for="sensitivity"></output><input id="sensitivity" type="range" min="0.5" max="2" step="0.1"></label>
    <label class="check"><input id="steady-lighting" type="checkbox"> Steady lighting</label>
    <p class="panel-note">Turn off steady lighting for a gentle variation in one gallery light.</p>
    <label class="setting" for="quality">Graphics quality<select id="quality"><option value="balanced">Balanced</option><option value="high">High</option><option value="performance">Performance</option></select></label>
    <p class="panel-note">Choose Performance for smoother movement on slower computers. High keeps more detail on larger displays.</p>
    <p id="audio-note" role="status"></p><button class="primary" id="close-settings">Done</button>
  </dialog>
  <dialog id="reading-dialog" aria-labelledby="reading-title">
    <p class="eyebrow" id="reading-byline"></p><h2 id="reading-title" tabindex="-1"></h2><div id="reading-body"></div>
    <button class="primary" id="close-reading">Continue exploring <span aria-hidden="true">↗</span></button>
    <p class="panel-note">Esc returns to the pause menu.</p>
  </dialog>`;
// Paint the menu before downloading and initializing the 3D engine.
void import('./runtime.ts').catch(error=>{
  document.querySelector('#enter-label')!.textContent='Unable to load the mall';
  document.querySelector('#status')!.textContent='Check your connection and reload to try again.';
  console.error(error);
});
