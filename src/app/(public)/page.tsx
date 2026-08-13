'use client';

import { HIDDEN_FEATURES } from '@lib/featureFlags';

import CartRecoverySection from './components/CartRecoverySection';
import FaqSection from './components/FaqSection';
import FeaturesGrid from './components/FeaturesGrid';
import FinalCta from './components/FinalCta';
import Footer from './components/Footer';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import HowItWorks from './components/HowItWorks';
import InstagramSection from './components/InstagramSection';
import PricingSection from './components/PricingSection';
import WhatsAppFloatingButton from './components/WhatsAppFloatingButton';
import WhatsAppSection from './components/WhatsAppSection';

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900" data-theme="light">
      <Header />
      <HeroSection />
      <HowItWorks />
      <InstagramSection />
      <WhatsAppSection />
      {!HIDDEN_FEATURES.cartRecovery && <CartRecoverySection />}
      <FeaturesGrid />
      <PricingSection />
      <FaqSection />
      <FinalCta />
      <Footer />
      <WhatsAppFloatingButton />
    </div>
  );
}
