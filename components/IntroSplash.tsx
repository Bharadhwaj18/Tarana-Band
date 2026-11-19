// First-visit intro: "Ta Ra Na" in Kannada, Hindi and other South Indian scripts floats in around the logo,
// then the screen wipes up like a poster being pulled away.
// Pure CSS + a tiny inline script, so it never blocks the page or hides content from search engines.

// "Ta Ra Na" in the band's languages: mostly Kannada, then Hindi, a few other South Indian scripts
const KANNADA = ['ತ', 'ರ', 'ನ'];
const HINDI = ['त', 'र', 'न'];
const TAMIL = ['த', 'ர', 'ன'];
const TELUGU = ['త', 'ర', 'న'];
const MALAYALAM = ['ത', 'ര', 'ന'];

// Size tier per symbol: Kannada and Hindi are the big letters, other scripts and marks stay small
type Tier = 'big' | 'small' | 'logo';
const SYMBOLS: { symbol: string; tier: Tier }[] = [
  ...[...KANNADA, ...KANNADA, ...KANNADA, ...KANNADA].map((symbol) => ({ symbol, tier: 'big' as Tier })), // 12 Kannada
  ...[...HINDI, ...HINDI, HINDI[0]].map((symbol) => ({ symbol, tier: 'big' as Tier })), // 7 Hindi
  ...[TAMIL[0], TAMIL[1], TELUGU[0], TELUGU[2], MALAYALAM[0], MALAYALAM[2], '♪', '✶'].map((symbol) => ({
    symbol,
    tier: 'small' as Tier,
  })),
  { symbol: 'LOGO', tier: 'logo' },
  { symbol: 'LOGO', tier: 'logo' },
  { symbol: 'LOGO', tier: 'logo' },
];
// Spread the scripts around instead of clustering Kannada in one corner
const ORDER = SYMBOLS.map((_, i) => (i * 7) % SYMBOLS.length);

// Fixed pseudo-random layout so server and browser render the same thing
const GLYPHS = ORDER.map((symbolIndex, i) => {
  const seed = (n: number) => {
    const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  // Keep glyphs out of the middle where the logo sits
  let left = seed(1) * 92 + 2;
  let top = seed(2) * 88 + 4;
  if (left > 32 && left < 68 && top > 30 && top < 70) {
    top = top < 50 ? top - 22 : top + 22;
  }
  const { symbol, tier } = SYMBOLS[symbolIndex];
  const size =
    tier === 'big' ? 44 + Math.round(seed(3) * 34) : tier === 'small' ? 18 + Math.round(seed(3) * 8) : 30;
  return {
    symbol,
    left,
    top,
    size,
    delay: (seed(4) * 0.9).toFixed(2),
    duration: (2.4 + seed(5) * 1.6).toFixed(2),
    red: i % 4 === 0,
    faint: tier === 'small',
  };
});

// Only toggles classes on <html>; the intro element itself is never removed,
// so React hydration still finds the markup it rendered on the server.
const SCRIPT = `(function(){var h=document.documentElement;try{
var p=location.pathname;
var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(p.indexOf('/admin')===0||reduce||sessionStorage.getItem('tarana-intro-seen')){h.classList.add('gp-intro-done');return;}
sessionStorage.setItem('tarana-intro-seen','1');
h.classList.add('gp-intro-playing');
var done=function(){h.classList.remove('gp-intro-playing');h.classList.add('gp-intro-done');};
var el=document.getElementById('gp-intro');
if(el)el.addEventListener('click',function(){h.classList.add('gp-intro-skip');setTimeout(done,450);});
setTimeout(done,2900);
}catch(e){h.classList.add('gp-intro-done');}})();`;

export default function IntroSplash() {
  return (
    <>
      <div id="gp-intro" className="gp-intro" aria-hidden="true">
        <div className="gp-intro-ink">
          <div className="gp-intro-ring" />
          {GLYPHS.map((g, i) =>
            g.symbol === 'LOGO' ? (
              <img
                key={i}
                src="/logo-white.png"
                alt=""
                className="gp-intro-glyph"
                style={{
                  left: `${g.left}%`,
                  top: `${g.top}%`,
                  width: 64,
                  height: 'auto',
                  animationDelay: `${g.delay}s`,
                  animationDuration: `${g.duration}s`,
                }}
              />
            ) : (
              <span
                key={i}
                className={`gp-intro-glyph ${g.red ? 'gp-intro-red' : ''} ${g.faint ? 'gp-intro-faint' : ''}`}
                style={{
                  left: `${g.left}%`,
                  top: `${g.top}%`,
                  fontSize: g.size,
                  animationDelay: `${g.delay}s`,
                  animationDuration: `${g.duration}s`,
                }}
              >
                {g.symbol}
              </span>
            )
          )}
          <div className="gp-intro-center">
            <img src="/logo-white.png" alt="" className="gp-intro-logo" />
            <p className="gp-intro-tag">Classical roots · Rock energy</p>
          </div>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
    </>
  );
}
