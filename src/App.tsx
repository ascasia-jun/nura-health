import { NoiseOverlay } from './components/NoiseOverlay'
import { Navigation } from './components/Navigation'
import { Hero } from './sections/Hero'
import { Features } from './sections/Features'
import { Philosophy } from './sections/Philosophy'
import { Protocols } from './sections/Protocols'
import { Membership } from './sections/Membership'
import { Footer } from './components/Footer'

function App() {
  return (
    <>
      <NoiseOverlay />
      <Navigation />
      <main>
        <Hero />
        <Features />
        <Philosophy />
        <Protocols />
        <Membership />
      </main>
      <Footer />
    </>
  )
}

export default App
