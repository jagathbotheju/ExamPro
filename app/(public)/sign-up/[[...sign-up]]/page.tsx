import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 32,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 4 }}>
          ExamPro
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Create your account</div>
      </div>
      <SignUp fallbackRedirectUrl="/" />
    </div>
  );
}
