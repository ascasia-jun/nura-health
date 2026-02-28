import { TechBackground } from './components/TechBackground'
import { Navigation } from './components/Navigation'
import { Hero } from './sections/Hero'
import { Features } from './sections/Features'
import { Protocols } from './sections/Protocols'
import { Membership } from './sections/Membership'
import { Footer } from './components/Footer'
import { AICompanionChat } from './components/AICompanionChat'
import { UserProvider, useUser } from './context/UserContext'
import { ChatOpsPage } from './components/ChatOpsPage'

const AppContent = () => {
  const { isLoggedIn } = useUser();

  if (isLoggedIn) {
    return <ChatOpsPage />;
  }

  return (
    <>
      <TechBackground />
      <Navigation />
      <main>
        <Hero />
        <Features />
        <Protocols />
        <Membership />
      </main>
      <AICompanionChat />
      <Footer />
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
