'use client';

import {
  ArrowRight,
  Bot,
  BarChart3,
  MessageSquare,
  Zap,
  Shield,
  Users,
  Clock,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Heart,
} from 'lucide-react';
import Link from 'next/link';

import ChannelsSection from './components/ChannelsSection';
import DashboardPreview from './components/DashboardPreview';
import FaqSection from './components/FaqSection';
import FeatureCard from './components/FeatureCard';
import PricingCard from './components/PricingCard';
import ScrollReveal from './components/ScrollReveal';
import StatCard from './components/StatCard';
import TestimonialCard from './components/TestimonialCard';

export default function Home() {
  return (
    <div className="min-h-screen" data-theme="light">
      <section className="relative overflow-hidden bg-linear-to-br from-indigo-50 via-white to-purple-50 pt-20 pb-32">
        <div className="absolute inset-0 bg-grid-slate-200 mask-[linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>

        <div className="relative max-w-7xl mx-auto px-6">
          <ScrollReveal direction="down">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
                <Sparkles size={16} />
                Transforme seu atendimento com IA
              </div>

              <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight">
                Atendimento Inteligente em{' '}
                <span className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">WhatsApp e Instagram</span>
              </h1>

              <p className="text-xl text-slate-600 mb-10 leading-relaxed">
                Automatize conversas, gerencie campanhas e aumente suas vendas com inteligência artificial. Tudo em uma única plataforma.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="group px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-lg shadow-lg shadow-indigo-500/50 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  Começar gratuitamente
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 rounded-xl font-semibold text-lg transition-all text-center"
                >
                  Fazer Login
                </Link>
              </div>

              <div className="mt-12 flex items-center justify-center gap-8 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-500" />
                  Sem cartão de crédito
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-500" />
                  7 dias grátis
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-500" />
                  Suporte em português
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <DashboardPreview />

      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <ScrollReveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <StatCard value="10k+" label="Empresas Ativas" />
              <StatCard value="5M+" label="Mensagens/Mês" />
              <StatCard value="98%" label="Satisfação" />
              <StatCard value="24/7" label="Disponibilidade" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                Tudo que você precisa em um só lugar
              </h2>
              <p className="text-xl text-slate-600">
                Recursos poderosos para transformar seu atendimento e aumentar suas vendas
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ScrollReveal delay={100}>
              <FeatureCard
                icon={Bot}
                title="IA Conversacional"
                description="Assistente virtual que responde automaticamente suas mensagens com contexto e personalidade do seu negócio."
              />
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <FeatureCard
                icon={MessageSquare}
                title="Multi-Canal"
                description="Gerencie WhatsApp e Instagram em uma única plataforma com histórico unificado de conversas."
              />
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <FeatureCard
                icon={Zap}
                title="Campanhas Automáticas"
                description="Envie mensagens em massa, programe campanhas e acompanhe métricas em tempo real."
              />
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <FeatureCard
                icon={BarChart3}
                title="Analytics Avançado"
                description="Dashboard completo com insights sobre abertura, engajamento e conversão das suas mensagens."
              />
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <FeatureCard
                icon={Users}
                title="CRM Integrado"
                description="Organize seus contatos, segmente públicos e personalize o atendimento para cada cliente."
              />
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <FeatureCard
                icon={Shield}
                title="Segurança Total"
                description="Criptografia de ponta a ponta, LGPD compliance e backup automático dos seus dados."
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      <ChannelsSection />

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                Planos para todos os tamanhos
              </h2>
              <p className="text-xl text-slate-600">
                Escolha o plano ideal para o seu negócio. Cancele quando quiser.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <ScrollReveal delay={100}>
              <PricingCard
                name="Starter"
                price="R$ 97"
                period="mês"
                description="Ideal para pequenos negócios"
                features={[
                  '1 canal (WhatsApp ou Instagram)',
                  'Até 1.000 mensagens/mês',
                  'IA básica com respostas automáticas',
                  'Dashboard com métricas essenciais',
                  'Suporte por email',
                ]}
              />
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <PricingCard
                name="Professional"
                price="R$ 297"
                period="mês"
                description="Para empresas em crescimento"
                features={[
                  '3 canais simultâneos',
                  'Até 10.000 mensagens/mês',
                  'IA avançada com contexto personalizado',
                  'Campanhas automatizadas ilimitadas',
                  'CRM completo com segmentação',
                  'Analytics avançado',
                  'Suporte prioritário 24/7',
                  'API de integração',
                ]}
                highlighted
              />
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <PricingCard
                name="Enterprise"
                price="Custom"
                period="mês"
                description="Soluções corporativas"
                features={[
                  'Canais ilimitados',
                  'Mensagens ilimitadas',
                  'IA personalizada para seu negócio',
                  'White label disponível',
                  'Infraestrutura dedicada',
                  'SLA garantido',
                  'Account manager dedicado',
                  'Treinamento in-company',
                ]}
                ctaText="Falar com vendas"
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                O que nossos clientes dizem
              </h2>
              <p className="text-xl text-slate-600">
                Mais de 10.000 empresas já transformaram seu atendimento com Synq
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            <ScrollReveal delay={100}>
              <TestimonialCard
                name="Maria Silva"
                role="CEO"
                company="Fashion Store"
                avatar="MS"
                rating={5}
                content="O Synq aumentou nossas vendas em 40% no primeiro mês. A IA responde os clientes instantaneamente e a equipe pode focar em vendas mais complexas."
              />
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <TestimonialCard
                name="João Santos"
                role="Gerente de Marketing"
                company="TechStart"
                avatar="JS"
                rating={5}
                content="Ferramenta indispensável para nossa operação. Conseguimos gerenciar múltiplos canais facilmente e as campanhas automatizadas são incríveis."
              />
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <TestimonialCard
                name="Ana Costa"
                role="Proprietária"
                company="Café Gourmet"
                avatar="AC"
                rating={5}
                content="Economizamos 20 horas por semana no atendimento. A IA entende perfeitamente nosso cardápio e os clientes adoram a rapidez nas respostas."
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      <FaqSection />

      <section className="py-24 bg-linear-to-br from-indigo-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <ScrollReveal>
            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Pronto para revolucionar seu atendimento?
              </h2>
              <p className="text-xl text-indigo-100 mb-8">
                Comece agora mesmo, sem compromisso. 7 dias grátis para testar todos os recursos.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="group px-8 py-4 bg-white hover:bg-indigo-50 text-indigo-600 rounded-xl font-semibold text-lg shadow-xl transition-all flex items-center justify-center gap-2">
                  Iniciar teste gratuito
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-8 py-4 bg-transparent hover:bg-white/10 text-white border-2 border-white rounded-xl font-semibold text-lg transition-all">
                  Agendar demonstração
                </button>
              </div>

              <div className="pt-8 flex items-center justify-center gap-6 text-indigo-100">
                <div className="flex items-center gap-2">
                  <Clock size={20} />
                  <span>Setup em 5 minutos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart size={20} />
                  <span>Suporte humanizado</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp size={20} />
                  <span>ROI comprovado</span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold text-xl mb-4">Synq</h3>
              <p className="text-sm leading-relaxed">
                Plataforma completa de atendimento inteligente para WhatsApp e Instagram.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Recursos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Preços
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Integrações
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Sobre
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Carreiras
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contato
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacidade
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Termos de Uso
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    LGPD
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-center text-sm">
            <p>&copy; 2026 Synq. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
