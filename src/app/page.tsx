'use client';

export default function Home() {
  const handleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_BFH_CLIENT_ID || 'your_client_id_here';
    const authUrl = 'https://auth.bravefrontierheroes.com/oauth2/auth';
    const redirectUri = `${window.location.origin}/callback`;
    const scope = 'openid profile email offline_access';
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const url = `${authUrl}?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;
    window.location.href = url;
  };

  return (
    <main style={{
      minHeight: '100svh',
      background: 'radial-gradient(ellipse at 50% 20%, #1a0900 0%, #080810 60%, #030306 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Noto Sans JP', sans-serif",
      userSelect: 'none',
      padding: '24px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Cinzel+Decorative:wght@700;900&family=Noto+Sans+JP:wght@400;700&display=swap');
        @keyframes shimmer {
          0%  { background-position: -400% center; }
          100%{ background-position:  400% center; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255,140,0,0.3), 0 0 40px rgba(255,60,0,0.15); }
          50%       { box-shadow: 0 0 40px rgba(255,140,0,0.6), 0 0 80px rgba(255,60,0,0.3); }
        }
        .login-btn {
          background: linear-gradient(135deg, rgba(255,140,0,0.15), rgba(255,60,0,0.1));
          border: 1px solid rgba(255,140,0,0.5);
          border-radius: 12px;
          color: #ffaa00;
          font-family: 'Cinzel Decorative', Cinzel, serif;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: 3px;
          padding: 18px 56px;
          cursor: pointer;
          transition: all 0.3s;
          text-transform: uppercase;
          animation: pulse-glow 2.5s ease-in-out infinite;
        }
        .login-btn:hover {
          background: linear-gradient(135deg, rgba(255,140,0,0.3), rgba(255,60,0,0.2));
          color: #ffd700;
          transform: scale(1.04);
        }
        .card-suit {
          animation: float 3s ease-in-out infinite;
          display: inline-block;
        }
      `}</style>

      {/* 王冠デコ */}
      <div style={{ marginBottom: 8, fontSize: 36, animation: 'float 3s ease-in-out infinite' }}>♠</div>

      {/* タイトル */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{
          fontFamily: "'Cinzel Decorative', Cinzel, serif",
          fontWeight: 900,
          fontSize: 'clamp(28px, 8vw, 48px)',
          background: 'linear-gradient(90deg, #ff3300, #ffd700, #ff8c00, #ffd700, #ff3300)',
          backgroundSize: '300% auto',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'shimmer 4s linear infinite',
          lineHeight: 1.15,
          letterSpacing: 2,
        }}>
          BFH<br />BLACKJACK
        </div>

      </div>

      {/* スーツデコライン */}
      <div style={{ display: 'flex', gap: 20, color: 'rgba(255,140,0,0.3)', fontSize: 18, marginBottom: 48 }}>
        <span>♠</span><span>♥</span><span>♦</span><span>♣</span>
      </div>

      {/* ログインボタン */}
      <button className="login-btn" onClick={handleLogin}>
        ブレヒロでログイン
      </button>

      <p style={{
        marginTop: 20,
        fontSize: 11,
        color: 'rgba(255,255,255,0.2)',
        letterSpacing: 1,
        fontFamily: "'Noto Sans JP', sans-serif",
      }}>
        BFH アカウントで認証して遊ぶ
      </p>
    </main>
  );
}
