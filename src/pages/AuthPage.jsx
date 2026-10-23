import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Leaf, LockKeyhole, Mail } from 'lucide-react';
import { Button, Field, Notice } from '../components/UI.jsx';
import { useApp } from '../state/AppContext.jsx';

export default function AuthPage() {
  const { pathname } = useLocation();
  const mode = pathname === '/signup' ? 'signup' : pathname === '/recover' ? 'recover' : pathname === '/reset-password' ? 'reset' : 'login';
  const navigate = useNavigate();
  const { cloudConfigured, signIn, signUp, recoverPassword, resetPassword, enterLocalMode } = useApp();
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const isSignup = mode === 'signup';
  const isRecovery = mode === 'recover';
  const isReset = mode === 'reset';
  const update = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      if (isRecovery) {
        await recoverPassword(values.email);
        setMessage('If an account matches that address, a password reset link is on its way.');
      } else if (isReset) {
        await resetPassword(values.password);
        setMessage('Your password has been updated. You can now log in.');
      } else if (isSignup) {
        await signUp(values.email, values.password, values.name);
        setMessage('Account created. Check your inbox to confirm your email, then log in.');
      } else {
        await signIn(values.email, values.password);
        navigate('/dashboard');
      }
    } catch (requestError) {
      setError(requestError.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-side">
        <Link to="/" className="brand"><span className="brand-mark"><Leaf size={19} /></span> streakup</Link>
        <div className="auth-side-copy"><div className="eyebrow">ONE DAY AT A TIME</div><h1>Consistency<br />is a practice,<br /><em>not a finish line.</em></h1><p>Notice the little things you do for the person you’re becoming.</p></div>
        <span className="auth-side-bottom">A softer way to stay on track.</span>
      </div>
      <section className="auth-form-side">
        <Link className="auth-back" to="/"><ArrowLeft size={16} /> Back home</Link>
        <div className="auth-form-wrap">
          <div className="auth-symbol"><Leaf size={20} /></div>
          <div className="eyebrow">{isRecovery || isReset ? 'ACCOUNT RECOVERY' : isSignup ? 'YOUR NEXT CHAPTER' : 'WELCOME BACK'}</div>
          <h2>{isRecovery ? 'Reset your password' : isReset ? 'Choose a new password' : isSignup ? 'Start your streak' : 'Good to see you.'}</h2>
          <p className="auth-subtitle">{isRecovery ? 'We’ll send you a secure link to get back in.' : isReset ? 'Choose a strong password for your account.' : isSignup ? 'A little progress goes a long way.' : 'Pick up right where you left off.'}</p>
          {!cloudConfigured && <Notice>Cloud authentication is not connected yet. Configure Supabase to enable accounts; local mode keeps data in this browser only.</Notice>}
          <form onSubmit={submit} className="auth-form">
            {isSignup && <Field label="Your name" name="name" autoComplete="name" value={values.name} onChange={update('name')} required maxLength={80} />}
            <Field label="Email address" name="email" type="email" autoComplete="email" value={values.email} onChange={update('email')} required />
            {!isRecovery && <Field label="Password" name="password" type="password" autoComplete={isSignup || isReset ? 'new-password' : 'current-password'} minLength={8} value={values.password} onChange={update('password')} required />}
            {error && <Notice tone="error">{error}</Notice>}
            {message && <Notice tone="success">{message}</Notice>}
            <Button type="submit" disabled={busy} className="auth-submit">{busy ? 'Please wait…' : isRecovery ? 'Send reset link' : isReset ? 'Update password' : isSignup ? 'Create account' : 'Log in'} <LockKeyhole size={15} /></Button>
          </form>
          {!isSignup && !isRecovery && !isReset && <Link className="recover-link" to="/recover">Forgot your password?</Link>}
          <div className="auth-switch">{isRecovery || isReset ? <Link to="/login">Back to log in</Link> : isSignup ? <>Already have an account? <Link to="/login">Log in</Link></> : <>New to StreakUp? <Link to="/signup">Create an account</Link></>}</div>
          <div className="auth-divider"><span>OR</span></div>
          <Button variant="outline" className="local-button" onClick={() => { enterLocalMode(); navigate('/dashboard'); }}>
            <Leaf size={16} /> Continue in local mode
          </Button>
          <p className="local-caption"><Mail size={13} /> Your local workspace stays on this device.</p>
        </div>
      </section>
    </main>
  );
}
