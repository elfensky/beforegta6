import React from 'react';
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import '@fontsource/anton/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-700.css';
import texas from './texas-path.json';
import timing from '../timing.json';
import './video.css';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };
const ease = (frame, from, to) => {
  const x = interpolate(frame, [from, to], [0, 1], clamp);
  return x * x * (3 - 2 * x);
};

function Credit({ children }) {
  return <div className="credit">{children}</div>;
}

function Label({ children, light = false }) {
  return (
    <div className={`label ${light ? 'light' : ''}`}>
      <span className="label-dot" />
      {children}
    </div>
  );
}

function Intro() {
  const frame = useCurrentFrame();
  const rows = [
    { text: 'THINGS', from: 0 },
    { text: 'WE GOT', from: 17 },
    { text: 'BEFORE', from: 31 },
    { text: 'GTA 6.', from: 47, accent: true },
  ];
  return (
    <AbsoluteFill className="intro">
      <div className="intro-title">
        {rows.map(({ text, from, accent }) => {
          const enter = spring({
            frame: frame - from,
            fps: timing.fps,
            config: { damping: 14, stiffness: 230 },
          });
          return (
            <span
              key={text}
              className={accent ? 'intro-gta' : undefined}
              style={{
                opacity: frame >= from ? 1 : 0,
                transformOrigin: 'left center',
                transform: accent
                  ? `translateY(${(1 - enter) * 20}px) rotate(${(1 - enter) * -5}deg) scale(${1.2 - enter * 0.2})`
                  : `translateX(${(1 - enter) * -35}px) scale(${0.93 + enter * 0.07})`,
              }}
            >
              {text}
            </span>
          );
        })}
      </div>
      <div className="intro-line" style={{ width: ease(frame, 54, 73) * 810 }} />
    </AbsoluteFill>
  );
}

function Car() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill className="car">
      <div className="film">
        <OffthreadVideo
          src={staticFile('tesla-action.mp4')}
          muted
          style={{
            width: 1728,
            height: 972,
            position: 'absolute',
            left: frame < 12 ? -324 : -495,
            top: 0,
          }}
        />
      </div>
      <div className="film-shade" />
      <div className="top">
        <Label>01 / 03</Label>
        <h1>
          FLYING
          <br />
          <span className="yellow">CARS.</span>
        </h1>
      </div>
      <div className="car-bottom">
        <div className="aside">yes, that is a car.</div>
        <div className="context">Tesla Roadster · prototype demonstration</div>
      </div>
      <Credit>Footage: © Tesla · Roadster Event · 15 Oct 2026</Credit>
    </AbsoluteFill>
  );
}

function Texas() {
  const frame = useCurrentFrame();
  const fill = interpolateColors(frame, [0, 12], ['#ee625f', '#2581ff']);
  const zoom = 1 + ease(frame, 6, 42) * 0.12;
  const visible = ease(frame, 8, 15);
  return (
    <AbsoluteFill className="texas">
      <div className="top">
        <Label>02 / 03</Label>
        <h1>
          <span className="blue">BLUE</span>
          <br />
          TEXAS.
        </h1>
      </div>
      <div className="race-label">2026 US Senate race</div>
      <div className="map" style={{ transform: `scale(${zoom})` }}>
        <Img src={staticFile('blue-texas.png')} style={{ width: '100%', opacity: 0.4 }} />
        <svg viewBox={texas.viewBox} className="map-overlay">
          <path d={texas.d} fill={fill} stroke="#fff7e9" strokeWidth="2.8" />
          <text
            x="418"
            y="448"
            textAnchor="middle"
            dominantBaseline="central"
            className="tx-pin"
            style={{ opacity: visible }}
          >
            TEXAS
          </text>
        </svg>
      </div>
      <div
        className="result"
        style={{ opacity: visible, transform: `translateY(${(1 - visible) * 20}px)` }}
      >
        <span className="check">✓</span>
        <div>
          James Talarico <span className="blue">(D)</span>
          <small>won the Senate race.</small>
        </div>
      </div>
      <Credit>
        Map: Coolxsearcher1414 + contributors · CC BY 4.0
        <br />
        Texas recoloured and animated · result: Ballotpedia
      </Credit>
    </AbsoluteFill>
  );
}

function Truck({ x = 0 }) {
  return (
    <svg viewBox="0 0 560 230" className="truck" style={{ transform: `translateX(${x}px)` }}>
      <path d="M22 170H470" stroke="#f5e9d6" strokeWidth="5" />
      <rect x="30" y="30" width="310" height="135" rx="8" fill="#f5e9d6" />
      <path d="M350 85h85l60 60v32H350Z" fill="#f5e9d6" />
      <path d="M370 100h55l40 40h-95Z" fill="#b82038" />
      <circle cx="117" cy="178" r="31" fill="#17171b" stroke="#f5e9d6" strokeWidth="8" />
      <circle cx="415" cy="178" r="31" fill="#17171b" stroke="#f5e9d6" strokeWidth="8" />
      <text
        x="185"
        y="112"
        textAnchor="middle"
        fill="#b82038"
        fontSize="42"
        fontFamily="DM Sans"
        fontWeight="700"
      >
        12 TONNES
      </text>
    </svg>
  );
}

function Chocolate() {
  const frame = useCurrentFrame();
  const departure = ease(frame, 42, 69) * 1150;
  const pop = spring({ frame: frame - 3, fps: 30, config: { damping: 18, stiffness: 150 } });
  return (
    <AbsoluteFill className="chocolate">
      <div className="top">
        <Label light>AND SOMEONE STOLE</Label>
        <h1 className="number" style={{ transform: `scale(${0.96 + Math.max(0, pop) * 0.04})` }}>
          12<span>TONNES</span>
        </h1>
        <div className="of">of KitKats.</div>
      </div>
      <div
        className="candy-picture"
        style={{ transform: `rotate(-5deg) scale(${1 + frame * 0.00035})` }}
      >
        <Img src={staticFile('kitkat-heist.jpg')} />
        <span>PRODUCT PHOTO · ILLUSTRATION</span>
      </div>
      <div className="road">
        <div className="road-line" />
        <Truck x={departure} />
      </div>
      <div
        className="heist-joke"
        style={{
          opacity: ease(frame, 66, 72),
          transform: `rotate(-3deg) scale(${1.08 - ease(frame, 66, 72) * 0.08})`,
        }}
      >
        GRAND THEFT KITKAT.
      </div>
      <Credit>
        Photo: Evan-Amos · CC0 · illustrative bars
        <br />
        Quantity: Nestlé’s corrected statement · 28 Mar 2026
      </Credit>
    </AbsoluteFill>
  );
}

function Website() {
  const frame = useCurrentFrame();
  const progress = ease(frame, 0, 45);
  const shotWidth = 810;
  const viewportHeight = 666;
  const maxScroll = (10800 * shotWidth) / 1080 - viewportHeight;
  const scroll = Math.min(1130, maxScroll) * progress;
  return (
    <AbsoluteFill className="website">
      <div className="top">
        <Label>THERE’S MORE.</Label>
        <h1>
          FIND OUT
          <br />
          <span className="pink">MORE AT</span>
        </h1>
      </div>
      <div className="site-window">
        <div className="browser-bar">
          <span>● ● ●</span>
          <div>beforegta6.wtf</div>
          <span>↗</span>
        </div>
        <div className="site-view">
          <Img
            src={staticFile('website-scroll.png')}
            style={{ width: shotWidth, transform: `translateY(${-scroll}px)` }}
          />
        </div>
      </div>
      <div className="final-url">
        beforegta6<span>.wtf</span>
      </div>
    </AbsoluteFill>
  );
}

export function Bangers() {
  const components = {
    intro: Intro,
    car: Car,
    texas: Texas,
    chocolate: Chocolate,
    website: Website,
  };
  return (
    <AbsoluteFill className="canvas">
      {timing.scenes.map((scene) => {
        const Scene = components[scene.id];
        return (
          <Sequence
            key={scene.id}
            from={Math.round(scene.start * 30)}
            durationInFrames={Math.round((scene.end - scene.start) * 30)}
          >
            <Scene />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
