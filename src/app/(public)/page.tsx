'use client';

import { HIDDEN_FEATURES } from '@lib/featureFlags';

import CampaignSection from './components/CampaignSection';
import CartRecoverySection from './components/CartRecoverySection';
import CommentAutomationSection from './components/CommentAutomationSection';
import FaqSection from './components/FaqSection';
import FeaturesGrid from './components/FeaturesGrid';
import FinalCta from './components/FinalCta';
import Footer from './components/Footer';
import FunnelSection from './components/FunnelSection';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import HowItWorks from './components/HowItWorks';
import InboxSection from './components/InboxSection';
import OfficialApiSection from './components/OfficialApiSection';
import PricingSection from './components/PricingSection';
import TestimonialsSection from './components/TestimonialsSection';
import WhatsAppFloatingButton from './components/WhatsAppFloatingButton';

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900" data-theme="light">
      <Header />

      {/*
        Superfície clara contínua (DESIGN_SYSTEM 9.6): um único gradiente cobre TODAS as
        seções claras de uma vez. As seções não têm fundo próprio, então não existe emenda
        entre elas — só uma variação lenta de tom ao longo da página inteira, do CTA
        final ao rodapé.
      */}
      <div className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,#eef2ff_0%,#f4f6ff_8%,#ffffff_20%,#f8fafc_34%,#ffffff_48%,#f8fafc_62%,#ffffff_76%,#f8fafc_88%,#ffffff_100%)]"
        />
        <div className="relative">
          <HeroSection />
          <OfficialApiSection />
          <HowItWorks />
          <CampaignSection />
          <FunnelSection />
          <InboxSection />
          <CommentAutomationSection />
          <TestimonialsSection />
          {!HIDDEN_FEATURES.cartRecovery && <CartRecoverySection />}
          <FeaturesGrid />
          <PricingSection />
          <FaqSection />
          <FinalCta />
          <Footer />
        </div>
      </div>
      <WhatsAppFloatingButton />
    </div>
  );
}
