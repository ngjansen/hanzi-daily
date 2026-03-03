import { useState, useEffect } from 'react';

type State = 'loading' | 'success' | 'error';

export function UnsubscribePage() {
  const [state, setState] = useState<State>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    const token = params.get('token');

    if (!email || !token) {
      setErrorMsg('Invalid unsubscribe link. Please contact support.');
      setState('error');
      return;
    }

    fetch('/api/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token }),
    })
      .then((res) => res.json())
      .then((json: { success?: boolean; error?: string }) => {
        if (json.success) {
          setState('success');
        } else {
          setErrorMsg(json.error ?? 'Unable to unsubscribe. Please try again.');
          setState('error');
        }
      })
      .catch(() => {
        setErrorMsg('Network error. Please try again.');
        setState('error');
      });
  }, []);

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        {state === 'loading' && (
          <>
            <div style={spinner} />
            <p style={bodyText}>Unsubscribing…</p>
          </>
        )}

        {state === 'success' && (
          <>
            <p style={chineseDisplay}>再见</p>
            <p style={subTitle}>You've been unsubscribed</p>
            <p style={bodyText}>You won't receive any more emails from 每日一词.</p>
            <a href="/" style={link}>← Back to HanziDaily</a>
          </>
        )}

        {state === 'error' && (
          <>
            <p style={errorTitle}>Something went wrong</p>
            <p style={bodyText}>{errorMsg}</p>
            <a href="/" style={link}>← Back to HanziDaily</a>
          </>
        )}
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'var(--bg)',
  padding: '24px',
};

const cardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  borderRadius: '20px',
  boxShadow: '0 12px 32px rgba(26,26,26,0.10), 0 4px 8px rgba(26,26,26,0.06)',
  padding: '48px 40px',
  maxWidth: '400px',
  width: '100%',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px',
};

const spinner: React.CSSProperties = {
  width: '32px',
  height: '32px',
  border: '2.5px solid rgba(200, 71, 58, 0.20)',
  borderTopColor: '#C8473A',
  borderRadius: '50%',
  animation: 'spin 0.7s linear infinite',
  marginBottom: '8px',
};

const chineseDisplay: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', Georgia, serif",
  fontSize: '64px',
  fontWeight: 900,
  color: 'var(--text-primary)',
  margin: '0 0 4px',
  lineHeight: 1.1,
  letterSpacing: '0.05em',
};

const subTitle: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', Georgia, serif",
  fontSize: '1.3rem',
  fontWeight: 600,
  color: 'var(--text-primary)',
  margin: 0,
};

const bodyText: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.95rem',
  color: 'var(--text-secondary)',
  margin: 0,
  lineHeight: 1.6,
};

const errorTitle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '1.1rem',
  fontWeight: 600,
  color: 'var(--brand)',
  margin: 0,
};

const link: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.9rem',
  color: 'var(--brand)',
  textDecoration: 'none',
  marginTop: '8px',
};
