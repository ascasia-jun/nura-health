import React, { useState, useEffect } from 'react';
import { TechBackground } from './components/TechBackground'
import { Navigation } from './components/Navigation'
import { Hero } from './sections/Hero'
import { Features } from './sections/Features'
import { Protocols } from './sections/Protocols'
import { Philosophy } from './sections/Philosophy'
import { Footer } from './components/Footer'
import { NoiseOverlay } from './components/NoiseOverlay'
import { ProtocolGeneratorWizard } from './components/ProtocolGeneratorWizard'
import { AICompanionChat } from './components/AICompanionChat'
import { LoginModal } from './components/LoginModal'
import { UserProvider, useUser } from './context/UserContext'
import { ChatOpsPage } from './components/ChatOpsPage'

const AppContent: React.FC = () => {
  const { user } = useUser();
  const [showWizard, setShowWizard] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // URL 해시 확인하여 ChatOps 페이지 진입 결정
  const [isChatOps, setIsChatOps] = useState(window.location.hash === '#chatops');

  useEffect(() => {
    const handleHashChange = () => {
      setIsChatOps(window.location.hash === '#chatops');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (isChatOps) {
    return <ChatOpsPage />;
  }

  return (
    <>
      <NoiseOverlay />
      <TechBackground />
      <Navigation onLoginClick={() => setShowLogin(true)} />
      <main>
        <Hero />
        <Features />
        <Protocols onStartWizard={() => setShowWizard(true)} />
        <Philosophy />
      </main>
      <AICompanionChat />
      <Footer />
      
      {showWizard && <ProtocolGeneratorWizard onClose={() => setShowWizard(false)} />}
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
