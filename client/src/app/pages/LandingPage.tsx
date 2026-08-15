import { useState, useEffect } from 'react';
import Navbar from '../components/landing/Navbar';
import CinematicSection from '../components/landing/CinematicSection';
import CareerPathways from '../components/landing/CareerPathways';
import HowItWorks from '../components/landing/HowItWorks';
import UserRoles from '../components/landing/UserRoles';
import CareerJourney from '../components/landing/CareerJourney';
import WhyUdyog from '../components/landing/WhyUdyog';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      const container = document.getElementById('cinematic-container');
      if (container) {
        const rect = container.getBoundingClientRect();
        // If we are currently inside the cinematic scroll section
        if (rect.top <= 100 && rect.bottom >= window.innerHeight * 0.4) {
          const outerHeight = container.offsetHeight;
          const scrollRange = outerHeight - window.innerHeight;
          const currentScroll = window.scrollY - container.offsetTop;
          const progress = Math.min(Math.max(currentScroll / scrollRange, 0), 1);
          
          if (progress < 0.50) {
            setActiveSection('home');
          } else {
            setActiveSection('about');
          }
          return;
        }
      }

      // Check below-fold sections
      const sections = ['pathways', 'how-it-works'];
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.6 && rect.bottom >= window.innerHeight * 0.2) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className="min-h-screen bg-white text-black antialiased"
      // `overflow-x: hidden` creates a scroll container in Chromium and breaks
      // the sticky viewport inside CinematicSection. `clip` keeps the page from
      // producing horizontal overflow without becoming the sticky container.
      style={{ overflowX: 'clip' }}
    >
      {/* Fixed navbar — always on top */}
      <Navbar activeSection={activeSection} />

      {/*
       * CinematicSection owns the entire Home → About journey.
       * It is 700vh tall; a sticky inner div pins the viewport
       * while ScrollTrigger reads progress to drive the canvas.
       *
       * Frames 01–40 → Home content visible
       * Frames 41–79 → About content cross-dissolves in
       */}
      <CinematicSection />

      {/* Normal below-fold sections */}
      <CareerPathways />
      <HowItWorks />
      <UserRoles />
      <CareerJourney />
      <WhyUdyog />
      <CTA />
      <Footer />
    </div>
  );
}
