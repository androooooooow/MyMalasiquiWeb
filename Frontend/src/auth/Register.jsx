// src/auth/Register.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { getRequestError, register } from '../api/auth';

const accountTypes = [
  {
    value: 'citizen',
    label: 'Citizen',
    description: 'Request help and receive safety updates.',
    icon: '✦',
  },
  {
    value: 'respondent',
    label: 'Responder',
    description: 'Coordinate and respond to emergency reports.',
    icon: '✚',
  },
];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    accountType: 'citizen',
    name: '',
    address: '',
    phone_num: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const details = {
      name: form.name.trim(),
      address: form.address.trim(),
      phone_num: form.phone_num.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.accountType,
    };

    if (Object.values(details).some((value) => !value)) {
      setError('Please complete every required field.');
      return;
    }

    try {
      setIsSubmitting(true);
      const data = await register(details);
      navigate(`/check-email?email=${encodeURIComponent(data.email)}`, { replace: true });
    } catch (requestError) {
      setError(getRequestError(requestError, 'We could not create your account. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Create your account"
      title="Join the rescue network"
      description="Set up your details so help can reach the right person, quickly."
      isRegister
      footer={
        <p>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      }
    >
      <form className="auth-form auth-form--register" onSubmit={handleSubmit}>
        {error && (
          <div className="auth-alert" role="alert">
            <span aria-hidden="true">!</span>
            <p>{error}</p>
          </div>
        )}

        <fieldset className="account-type">
          <legend>Choose account type</legend>
          <div className="role-selector">
            {accountTypes.map((accountType) => (
              <label className="role-option" key={accountType.value}>
                <input
                  type="radio"
                  name="accountType"
                  value={accountType.value}
                  checked={form.accountType === accountType.value}
                  onChange={handleChange}
                />
                <span className="role-card">
                  <span className="role-icon" aria-hidden="true">{accountType.icon}</span>
                  <span>
                    <strong>{accountType.label}</strong>
                    <small>{accountType.description}</small>
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="form-grid">
          <label className="form-field" htmlFor="register-name">
            <span>Full name</span>
            <input
              className="auth-input"
              id="register-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Juan Dela Cruz"
              value={form.name}
              onChange={handleChange}
              required
            />
          </label>

          <label className="form-field" htmlFor="register-phone">
            <span>Phone number</span>
            <input
              className="auth-input"
              id="register-phone"
              name="phone_num"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="09XX XXX XXXX"
              value={form.phone_num}
              onChange={handleChange}
              required
            />
          </label>

          <label className="form-field form-field--wide" htmlFor="register-address">
            <span>Address</span>
            <input
              className="auth-input"
              id="register-address"
              name="address"
              type="text"
              autoComplete="street-address"
              placeholder="Barangay, Malasiqui, Pangasinan"
              value={form.address}
              onChange={handleChange}
              required
            />
          </label>

          <label className="form-field form-field--wide" htmlFor="register-email">
            <span>Email address</span>
            <input
              className="auth-input"
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>

          <label className="form-field form-field--wide" htmlFor="register-password">
            <span>Password</span>
            <input
              className="auth-input"
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength="8"
              maxLength="72"
              pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,72}"
              title="Use 8–72 characters with uppercase, lowercase, and a number"
              placeholder="8+ chars, upper/lowercase and a number"
              value={form.password}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
        <p className="form-security-note">We’ll email you a secure link. Your dashboard stays locked until you verify it.</p>
      </form>
    </AuthLayout>
  );
}
