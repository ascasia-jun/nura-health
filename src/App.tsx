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
  const { isLoggedIn, user } = useUser();
  const [showLogin, setShowLogin] = useState(false);

  // URL 해시를 기반으로 ChatOps 진입 여부 판단
  const [isChatOps, setIsChatOps] = useState(window.location.hash === '#chatops');

  const checkAuthAndNavigate = useCallback(() => {
    // 1. 이미 로그인된 상태라면 바로 이동
    if (isLoggedIn) {
      window.location.hash = '#chatops';
    } else {
      // 2. 로그인 안된 경우 모달만 띄움 (해시는 로그인 성공 후 변경)
      setShowLogin(true);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const handleHashChange = () => {
      const currentHash = window.location.hash;
      
      if (currentHash === '#chatops') {
        // [중요] 상태 업데이트 경합을 방지하기 위해 isLoggedIn과 user 존재 여부를 함께 체크
        if (isLoggedIn || localStorage.getItem('repoinsight_user')) {
          setIsChatOps(true);
          setShowLogin(false);
        } else {
          // 비인증 상태에서 직접 #chatops 접근 시에만 로그인 팝업 유도
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

  // 로그아웃 감지 및 상태 강제 초기화
  useEffect(() => {
    if (!isLoggedIn) {
      setIsChatOps(false);
      // 로그아웃 시 명시적으로 해시 제거
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
