import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Award, BookOpen, CheckCircle2, HelpCircle, Lock, Mail, MessageSquareText,
  Music2, Phone, Send, ShieldCheck, Timer, User, Users, ChevronDown,
} from 'lucide-react';
import { Brand, ThemeToggle } from '../components/Brand.jsx';
import { api, ApiError } from '../api';
import { CATEGORIES, USER_TYPES } from '../constants';

const EMPTY = { userType: '', category: '', name: '', email: '', phone: '', message: '' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9][0-9\s-]{6,18}$/;

function validate(v) {
  const e = {};
  if (!v.userType) e.userType = 'Select who you are.';
  if (!v.category) e.category = 'Select a category.';
  if (v.name.trim().length < 2) e.name = 'Please enter your full name.';
  if (!EMAIL_RE.test(v.email.trim())) e.email = 'Enter a valid email address.';
  if (!PHONE_RE.test(v.phone.trim())) e.phone = 'Enter a valid phone number.';
  if (v.message.trim().length < 5) e.message = 'Tell us a little more (min 5 characters).';
  return e;
}

const FEATURES = [
  { icon: Award, title: 'Scholarships', text: 'Merit and need-based funding guidance.' },
  { icon: BookOpen, title: 'Admissions', text: 'Eligibility, dates and documentation help.' },
  { icon: Music2, title: 'Concerts & Events', text: 'Passes, schedules and participation.' },
  { icon: HelpCircle, title: 'General Queries', text: 'Anything else, answered by a real person.' },
];

function Field({ label, icon: Icon, error, children, htmlFor }) {
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={htmlFor}>{label}</label>
      <div className="control">
        {Icon && <Icon className="field-icon" size={18} />}
        {children}
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}

export default function InquiryPage() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [done, setDone] = useState(false);

  const set = (k) => (e) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    setServerError('');
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await api.submitInquiry({
        ...values,
        name: values.name.trim(), email: values.email.trim(),
        phone: values.phone.trim(), message: values.message.trim(),
      });
      setDone(true);
      setValues(EMPTY);
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="public-page">
      <div className="bg-orbs" aria-hidden="true"><i /><i /><i /></div>

      <header className="topbar container">
        <Brand />
        <div className="topbar-actions">
          <ThemeToggle />
          <Link to="/admin/login" className="btn btn-ghost">
            <Lock size={16} /> <span className="hide-xs">Admin</span> Login
          </Link>
        </div>
      </header>

      <main className="container hero-grid">
        <section className="hero-copy">
          <span className="pill"><span className="dot" /> Replies within 24 hours</span>
          <h1>
            Questions about your <span className="grad">education journey?</span>
          </h1>
          <p className="lead">
            Send us your inquiry and our counsellors will get back to you personally. No bots, no waiting in queues.
          </p>

          <div className="feature-grid">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div className="feature" key={title}>
                <span className="feature-icon"><Icon size={20} /></span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>

          <ul className="trust-row">
            <li><ShieldCheck size={16} /> Your data stays private</li>
            <li><Timer size={16} /> Takes under a minute</li>
            <li><Users size={16} /> 10,000+ families helped</li>
          </ul>
        </section>

        <section className="form-card glass" aria-labelledby="form-title">
          {done ? (
            <div className="success">
              <div className="success-badge"><CheckCircle2 size={40} /></div>
              <h2>Inquiry received!</h2>
              <p>Thank you for reaching out. Our team will contact you on the email and phone number you provided.</p>
              <button className="btn btn-primary" onClick={() => setDone(false)}>
                Send another inquiry <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate>
              <div className="form-head">
                <h2 id="form-title">Send an inquiry</h2>
                <p>Fill in the details below and we'll take it from here.</p>
              </div>

              {serverError && <div className="alert" role="alert">{serverError}</div>}

              <div className="row-2">
                <Field label="I am a" htmlFor="userType" error={errors.userType} icon={Users}>
                  <select id="userType" value={values.userType} onChange={set('userType')}>
                    <option value="" disabled>Select type</option>
                    {USER_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <ChevronDown className="chevron" size={16} />
                </Field>
                <Field label="Category" htmlFor="category" error={errors.category} icon={BookOpen}>
                  <select id="category" value={values.category} onChange={set('category')}>
                    <option value="" disabled>Select category</option>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="chevron" size={16} />
                </Field>
              </div>

              <Field label="Full name" htmlFor="name" error={errors.name} icon={User}>
                <input id="name" type="text" autoComplete="name" placeholder="Your full name"
                  value={values.name} onChange={set('name')} maxLength={100} />
              </Field>

              <div className="row-2">
                <Field label="Email" htmlFor="email" error={errors.email} icon={Mail}>
                  <input id="email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com"
                    value={values.email} onChange={set('email')} maxLength={254} />
                </Field>
                <Field label="Phone number" htmlFor="phone" error={errors.phone} icon={Phone}>
                  <input id="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="+91 98765 43210"
                    value={values.phone} onChange={set('phone')} maxLength={20} />
                </Field>
              </div>

              <Field label="Message / query" htmlFor="message" error={errors.message} icon={MessageSquareText}>
                <textarea id="message" rows={4} placeholder="How can we help you?"
                  value={values.message} onChange={set('message')} maxLength={2000} />
              </Field>
              <div className="char-count">{values.message.length}/2000</div>

              <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={submitting}>
                {submitting ? <><span className="btn-spinner" /> Sending...</> : <><Send size={18} /> Submit inquiry</>}
              </button>
            </form>
          )}
        </section>
      </main>

      <footer className="container footer">
        <span>&copy; {new Date().getFullYear()} EduNova. All rights reserved.</span>
      </footer>
    </div>
  );
}
