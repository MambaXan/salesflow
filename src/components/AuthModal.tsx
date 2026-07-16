import React, { useState } from 'react';
import { useAuth } from '../сontext/AuthContext';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Стейт для видимости пароля
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegister ? '/auth/register' : '/auth/login';
    console.log(`Sending request to: ${endpoint} with email: ${email}`);
    
    try {
      const response = await fetch(`http://127.0.0.1:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Something went wrong');
      }

      if (isRegister) {
        console.log('Registration successful!');
        setIsRegister(false); 
        setError('Success! Account created. Please Sign In now.');
        setPassword(''); 
      } else {
        console.log('Login successful! Token received.');
        if (data.access_token) {
          login(data.access_token);
          onClose();
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsRegister((prev) => !prev);
    setError('');
    setPassword('');
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal__header">
          <h3>{isRegister ? 'Create Account' : 'Sign In'}</h3>
          <button className="auth-modal__close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-modal__form">
          <div className="auth-modal__field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="auth-modal__field">
            <label>Password</label>
            <div className="auth-modal__password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'} // Меняем тип динамически
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="auth-modal__toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div className={`auth-modal__message ${error.includes('Success') ? 'success' : 'error'}`}>
              {error}
            </div>
          )}

          <button type="submit" className="auth-modal__submit-btn" disabled={loading}>
            {loading ? 'Processing...' : isRegister ? 'Register' : 'Sign In'}
          </button>
        </form>

        <div className="auth-modal__toggle">
          <span>{isRegister ? 'Already have an account?' : "Don't have an account?"}</span>
          <button type="button" onClick={handleToggleMode}>
            {isRegister ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
};