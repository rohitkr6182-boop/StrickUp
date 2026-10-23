import { Link } from 'react-router-dom';
import { ArrowRight, Check, Flame, Leaf, Timer, TrendingUp } from 'lucide-react';
import { Button } from '../components/UI.jsx';

const highlights = [
  { icon: Check, title: 'Habits that fit your life', text: 'Make a routine yours, track it day by day, and keep the small wins visible.' },
  { icon: Timer, title: 'Focused study sessions', text: 'Start a timer, take a pause, and keep an honest record of your learning time.' },
  { icon: TrendingUp, title: 'Progress you can trust', text: 'See your own activity in a calendar, streaks, and clear weekly and monthly views.' },
];

export default function Landing() {
  return (
    <main className="landing">
      <header className="marketing-nav">
        <Link to="/" className="brand"><span className="brand-mark"><Leaf size={19} /></span> streakup</Link>
        <nav>
          <a href="#features">Why StreakUp</a>
          <Link to="/login">Log in</Link>
          <Link to="/signup"><Button className="nav-cta">Get started <ArrowRight size={15} /></Button></Link>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> YOUR PROGRESS, IN YOUR HANDS</div>
          <h1>Small steps.<br /><em>Real momentum.</em></h1>
          <p className="hero-description">A calmer way to build better habits, protect your focus, and see how far you’ve come — one day at a time.</p>
          <div className="hero-actions">
            <Link to="/signup"><Button>Build your streak <ArrowRight size={17} /></Button></Link>
            <Link className="text-link" to="/login">I already have an account</Link>
          </div>
          <div className="hero-footnote"><span className="tiny-leaves"><Leaf size={14} /></span> Thoughtful tracking, no guilt. Just keep showing up.</div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="sun-disc" />
          <div className="hero-plant plant-one"><span /><span /><span /><i /></div>
          <div className="hero-plant plant-two"><span /><span /><i /></div>
          <div className="hero-card">
            <div className="hero-card-top"><div><small>YOUR DAILY RHYTHM</small><strong>A little progress, every day</strong></div><span className="flame-badge"><Flame size={18} /></span></div>
            <div className="rhythm-row"><span>Read a few pages</span><b><Check size={13} /></b></div>
            <div className="rhythm-row"><span>Study with focus</span><b><Check size={13} /></b></div>
            <div className="rhythm-row muted"><span>Take a mindful break</span><b><span /></b></div>
            <div className="week-strip"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
            <div className="week-dots"><i /><i /><i /><i /><i /><i /><i /></div>
          </div>
          <div className="floating-note"><span className="note-icon"><Leaf size={15} /></span><div><small>KEEP GROWING</small><strong>Progress over perfect</strong></div></div>
          <div className="art-ground" />
        </div>
      </section>

      <section className="trust-row">
        <p>MAKE ROOM FOR WHAT MATTERS</p>
        <div><span><Check size={14} /> Your data stays yours</span><span><Check size={14} /> Built for real life</span><span><Check size={14} /> No streak-shaming</span></div>
      </section>

      <section id="features" className="features-section">
        <div className="section-heading"><div className="eyebrow">A GENTLER WAY TO GROW</div><h2>Make consistency<br /><em>feel possible.</em></h2><p>Tools that help you notice your effort, not just the days you missed.</p></div>
        <div className="feature-grid">{highlights.map(({ icon: Icon, title, text }) => <article className="feature-card" key={title}><span><Icon size={20} /></span><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>

      <section className="closing-cta"><div><div className="eyebrow">START WHERE YOU ARE</div><h2>Your next small step<br />starts <em>today.</em></h2></div><Link to="/signup"><Button>Get started — it’s simple <ArrowRight size={16} /></Button></Link></section>
      <footer className="marketing-footer"><Link to="/" className="brand"><span className="brand-mark"><Leaf size={17} /></span> streakup</Link><span>Made for the long game.</span><Link to="/login">Log in</Link></footer>
    </main>
  );
}
