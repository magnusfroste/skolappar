/*
 * Skolappar's snippet: tells skolappar.org, anonymously, how an app is used, so the parent's
 * agent can make it better. No cookies, no storage, no ids – only counts per app and day.
 *
 *   <script src="https://www.skolappar.org/kotten.js" defer></script>
 *
 * It counts a start and the time played by itself. The app can add, when they happen:
 *   skolappar.event('round_start')         a round begins
 *   skolappar.event('round_done', 80)      a round ends (value: the result in per cent, optional)
 *   skolappar.event('level', 2)            the child reaches a level (value: the level, 1–50)
 *   skolappar.event('hint')                a hint or a second try was needed
 *   skolappar.event('sound_off')           the sound was turned off
 *
 * From the levels skolappar shows the game's maker how far children get and where they stop
 * (the last level of a visit is sent when the child leaves).
 *
 * Reading aloud is counted by itself: a recorded line (an audio file the app plays) or the
 * browser's own voice (speechSynthesis) – so the maker sees how much of what the app says is
 * really recorded. Only the two counts; never what was said.
 */
(function () {
  // the events go back where the script came from (www.skolappar.org, or .com for apps that load it there)
  var origin = 'https://www.skolappar.org';
  try { if (document.currentScript && document.currentScript.src) origin = new URL(document.currentScript.src).origin; } catch (e) { /* keep the default */ }
  var ENDPOINT = origin + '/api/events';
  var NAMES = { round_start: 1, round_done: 1, level: 1, hint: 1, sound_off: 1 };
  var queue = [{ e: 'start' }];
  var shownAt = document.visibilityState === 'visible' ? Date.now() : 0;
  var played = 0;
  var lastLevel = 0;

  function send(final) {
    if (shownAt) { played += Date.now() - shownAt; shownAt = document.visibilityState === 'visible' && !final ? Date.now() : 0; }
    var seconds = Math.round(played / 1000);
    if (final && lastLevel) { queue.push({ e: 'stop', v: lastLevel }); lastLevel = 0; }
    if (!queue.length && !(final && seconds)) return;
    var body = JSON.stringify({ events: queue.splice(0, 50), seconds: final ? Math.min(seconds, 7200) : 0 });
    if (final) played = 0;
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, body)) return;
      fetch(ENDPOINT, { method: 'POST', body: body, keepalive: true, mode: 'no-cors' });
    } catch (e) { /* nothing is lost for the child: the app works without it */ }
  }

  function count(name) {
    queue.push({ e: name });
    if (queue.length >= 20) send(false);
  }
  try {
    var play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      try {
        if (this instanceof HTMLAudioElement && /\.(mp3|m4a|ogg|opus|wav)([?#]|$)/i.test(this.currentSrc || this.src || '')) count('voice_file');
      } catch (e) { /* counting never stops the sound */ }
      return play.apply(this, arguments);
    };
  } catch (e) { /* an old browser: no count */ }
  try {
    if (window.speechSynthesis && speechSynthesis.speak) {
      var speak = speechSynthesis.speak.bind(speechSynthesis);
      speechSynthesis.speak = function (u) { count('voice_browser'); return speak(u); };
    }
  } catch (e) { /* no count */ }

  window.skolappar = {
    event: function (name, value) {
      if (!NAMES[name]) return;
      var v = Number(value);
      if (name === 'level' && isFinite(v) && v >= 1) lastLevel = Math.min(50, Math.round(v));
      queue.push(isFinite(v) && value !== undefined ? { e: name, v: Math.max(0, Math.min(100, Math.round(v))) } : { e: name });
      if (queue.length >= 20) send(false);
    },
  };

  setInterval(function () { send(false); }, 30000);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') send(true);
    else shownAt = Date.now();
  });
  window.addEventListener('pagehide', function () { send(true); });
})();
