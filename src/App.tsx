import React, { useState, useEffect, useCallback } from 'react';
import { TechBackground } from './components/TechBackground'
import { Navigation } from './components/Navigation'
import { Hero } from './sections/Hero'
import { Footer } from './components/Footer'
import { NoiseOverlay } from './components/NoiseOverlay'
import { AICompanionChat } from './components/AICompanionChat'
import { LoginModal } from './components/LoginModal'
import { UserProvider, useUser } from './context/UserContext'
import { ChatOpsPage } from './components/ChatOpsPage'

const AppContent: React.FC = () => {
  const { isLoggedIn } = useUser();
  const [showLogin, setShowLogin] = useState(false);

  // URL 해시를 기반으로 ChatOps 진입 여부 판단
  const [isChatOps, setIsChatOps] = useState(window.location.hash === '#chatops');

  const checkAuthAndNavigate = useCallback(() => {
    if (isLoggedIn) {
      window.location.hash = '#chatops';
    } else {
      setShowLogin(true);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const handleHashChange = () => {
      const currentHash = window.location.hash;
      
      if (currentHash === '#chatops') {
        if (isLoggedIn) {
          setIsChatOps(true);
          setShowLogin(false); // 로그인 상태면 팝업 닫기
        } else {
          // 비인증 상태에서 ChatOps 접근 시 로그인 팝업 유도
          window.location.hash = '';
          setIsChatOps(false);
          setShowLogin(true);
        }
      } else {
        setIsChatOps(false);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isLoggedIn]);

  // [중요] 로그아웃 감지 및 상태 강제 초기화
  useEffect(() => {
    if (!isLoggedIn) {
      setIsChatOps(false);
      setShowLogin(false); // 로그아웃 시 무조건 로그인 팝업 닫기
      
      // 만약 해시가 여전히 남아있다면 제거
      if (window.location.hash === '#chatops') {
        window.location.hash = '';
      }
    }
  }, [isLoggedIn]);

  if (isChatOps && isLoggedIn) {
    return <ChatOpsPage />;
  }

  return (
    <>
      <NoiseOverlay />
      <TechBackground />
      <Navigation onLoginClick={() => setShowLogin(true)} />
      <main>
        <Hero onStartClick={checkAuthAndNavigate} />
      </main>
      <AICompanionChat />
      <Footer />
      
      {showLogin && <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />}
    </>
  );
};

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  )
}

export default App
