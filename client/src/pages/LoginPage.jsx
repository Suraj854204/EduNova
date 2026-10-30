import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, KeyRound, LogIn, Mail, ShieldCheck } from 'lucide-react';
import { Brand, ThemeToggle } from '../components/Brand.jsx';
import { useAuth } from '../AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) return setError('Enter your email and password.');
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="public-page login-page">
      <div className="bg-orbs" aria-hidden="true"><i /><i /><i /></div>

      <header className="topbar container">
        <Link to="/" className="back-link"><ArrowLeft size={16} /> Back to site</Link>
        <ThemeToggle />
      </header>

      <main className="login-wrap">
        <div className="login-card glass">
          <Brand />
          <div className="login-badge"><ShieldCheck size={16} /> Secure admin area</div>
          <h1>Welcome back</h1>
          <p className="muted">Sign in to manage inquiries.</p>

          {error && <div className="alert" role="alert">{error}</div>}

          <form onSubmit={onSubmit} noValidate>
            <div className="field">
              <label htmlFor="email">Email</label>
              <div className="control">
                <Mail className="field-icon" size={18} />
                <input id="email" type="email" autoComplete="username" placeholder="admin@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="control">
                <KeyRound className="field-icon" size={18} />
                <input id="password" type={show ? 'text' : 'password'} autoComplete="current-password"
                  placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" className="eye" onClick={() => setShow((s) => !s)}
                  aria-label={show ? 'Hide password' : 'Show password'}>
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={busy}>
              {busy ? <><span className="btn-spinner" /> Signing in...</> : <><LogIn size={18} /> Sign in</>}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
