import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { useAuth } from "../contexts/AuthContext";
import { Helmet } from "react-helmet-async";

/**
 * Login component for Zoneweaver authentication
 * @returns {JSX.Element} Login component
 */
const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  /**
   * Redirect to dashboard if already authenticated
   */
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/ui");
    }
  }, [isAuthenticated, navigate]);

  /**
   * Handle login form submission
   * @param {Event} e - Form submit event
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!identifier || !password) {
      setMsg("Please enter both username/email and password");
      return;
    }

    try {
      setLoading(true);
      setMsg("");
      
      const result = await login(identifier, password);
      
      if (result.success) {
        // Check for stored intended URL and redirect there
        const intendedUrl = localStorage.getItem('zoneweaver_intended_url');
        if (intendedUrl) {
          localStorage.removeItem('zoneweaver_intended_url');
          navigate(intendedUrl);
        } else {
          navigate("/ui");
        }
      } else {
        setMsg(result.message);
      }
    } catch (error) {
      console.error("Login error:", error);
      setMsg("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <section className='hero is-fullheight is-fullwidth'>
      <Helmet>
        <meta charSet='utf-8' />
        <title>Login - Zoneweaver</title>
        <link rel='canonical' href={window.location.origin} />
      </Helmet>
      <div className='hero-body'>
        <div className='container'>
          <div className='columns is-centered'>
            <div className='column is-4-desktop'>
              <form onSubmit={handleLogin} className='box has-text-centered'>
                <p className='is-size-1'>Zoneweaver {__APP_VERSION__ || '1.0.0'}</p>
                <figure className='image container my-1 py-1 is-256x256'>
                  <Logo />
                </figure>
                {msg && (
                  <div className={`notification ${msg.includes('error') || msg.includes('failed') ? 'is-danger' : 'is-info'}`}>
                    <p>{msg}</p>
                  </div>
                )}
                <div className='field mt-5'>
                  <label className='label'>Email or Username</label>
                  <div className='controls'>
                    <input 
                      type='text' 
                      className='input' 
                      name='identifier' 
                      autoComplete='username' 
                      placeholder='Username or Email' 
                      value={identifier} 
                      onChange={(e) => setIdentifier(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className='field mt-5'>
                  <label className='label'>Password</label>
                  <div className='controls'>
                    <input
                      type='password'
                      name='password'
                      autoComplete='current-password'
                      className='input'
                      placeholder='******'
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className='field mt-5'>
                  <button 
                    type='submit'
                    className={`button is-primary is-fullwidth ${loading ? 'is-loading' : ''}`}
                    disabled={loading}
                  >
                    Login
                  </button>
                </div>
                <div className='has-text-centered mt-3'>
                  <p>
                    Don't have an account?{' '}
                    <a href='/register' className='has-text-link'>
                      Register here
                    </a>
                  </p>
                </div>
                <div className='has-text-centered mt-3'>
                  <a href='https://github.com/Makr91/Zoneweaver' className='has-text-grey'>
                    Documentation
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;
