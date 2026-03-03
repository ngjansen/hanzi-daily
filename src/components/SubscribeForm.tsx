import { useState, useId } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import styles from './SubscribeForm.module.css';

type State = 'idle' | 'loading' | 'success' | 'error';

export function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<State>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const inputId = useId();
  const statusId = useId();
  const { lang, t } = useLanguage();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const json = (await res.json()) as { success?: boolean; error?: string };

      if (res.ok && json.success) {
        setState('success');
      } else {
        setErrorMsg(json.error ?? (lang === 'zh' ? '出了点问题，请重试。' : 'Something went wrong. Please try again.'));
        setState('error');
      }
    } catch {
      setErrorMsg(lang === 'zh' ? '网络错误，请检查网络连接。' : 'Network error. Please check your connection and try again.');
      setState('error');
    }
  }

  return (
    <section className={styles.section} aria-labelledby="subscribe-heading">
      <div className={styles.inner}>

        <div className={styles.eyebrow}>{t('通讯订阅', 'Newsletter')}</div>
        <h2 className={styles.heading} id="subscribe-heading">
          {t('每日一词，直送邮箱', '每日一词，delivered to your inbox')}
        </h2>
        <p className={styles.description}>
          {t(
            '每天早上精选一个中文词汇。词源、例句与文化背景——两分钟读懂。',
            'One carefully chosen Chinese word every morning. Etymology, examples, and cultural context — in under two minutes.'
          )}
        </p>

        {state === 'success' ? (
          <div className={styles.success} role="status" aria-live="polite">
            <span className={styles.successIcon} aria-hidden="true">✦</span>
            <div>
              <p className={styles.successTitle}>{t('订阅成功', "You're subscribed")}</p>
              <p className={styles.successSub}>{t('明天早上将收到您的第一个词汇。', 'Expect your first word tomorrow morning.')}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className={styles.form}>
            <div className={styles.inputRow}>
              <label htmlFor={inputId} className={styles.srOnly}>
                {t('邮箱地址', 'Email address')}
              </label>
              <input
                id={inputId}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={state === 'loading'}
                aria-describedby={state === 'error' ? statusId : undefined}
                className={styles.input}
                autoComplete="email"
              />
              <button
                type="submit"
                disabled={state === 'loading' || !email}
                className={styles.button}
              >
                {state === 'loading' ? (
                  <span className={styles.spinner} aria-hidden="true" />
                ) : (
                  t('订阅', 'Subscribe')
                )}
                {state === 'loading' && <span className={styles.srOnly}>{t('加载中…', 'Loading…')}</span>}
              </button>
            </div>

            {state === 'error' && (
              <p
                id={statusId}
                className={styles.errorMsg}
                role="alert"
                aria-live="polite"
              >
                {errorMsg}
              </p>
            )}
          </form>
        )}

        <p className={styles.disclaimer}>
          {t('永久免费。不发垃圾邮件。随时退订。', 'Free forever. No spam. Unsubscribe anytime.')}
        </p>
      </div>
    </section>
  );
}
