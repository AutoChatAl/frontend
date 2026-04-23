import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Termos de Uso — Synq',
  description:
    'Termos de Uso da plataforma Synq, operada por 54.623.148 VINICIOS COELHO FELIPE DA COSTA (CNPJ 54.623.148/0001-01).',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://www.synq.app.br/termos' },
};

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-white" data-theme="light">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <Link
            href="/"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Voltar para Synq
          </Link>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
          Termos de Uso
        </h1>
        <p className="text-sm text-slate-500 mb-10">
          Última atualização: 23 de abril de 2026
        </p>

        <section className="prose prose-slate max-w-none space-y-6 text-slate-700 leading-relaxed">
          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">
            1. Aceitação
          </h2>
          <p>
            Ao criar uma conta, acessar ou utilizar a plataforma{' '}
            <strong>Synq</strong> (“plataforma”, “serviço”), você (“usuário”,
            “você”) declara ter lido, entendido e aceito integralmente estes
            Termos de Uso e a nossa{' '}
            <Link
              href="/privacidade"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Política de Privacidade
            </Link>
            . Caso não concorde, não utilize o serviço.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">
            2. Identificação do fornecedor
          </h2>
          <p>
            A Synq é operada por:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>54.623.148 VINICIOS COELHO FELIPE DA COSTA</strong>
            </li>
            <li>
              <strong>CNPJ:</strong> 54.623.148/0001-01
            </li>
            <li>
              <strong>Contato:</strong>{' '}
              <a
                href="mailto:suporte.synq@proton.me"
                className="text-indigo-600 hover:text-indigo-700"
              >
                suporte.synq@proton.me
              </a>
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">
            3. Descrição do serviço
          </h2>
          <p>
            A Synq é uma plataforma SaaS de atendimento inteligente que permite a
            empresas conectar suas contas comerciais do Instagram, Facebook e
            WhatsApp, centralizar conversas e comentários, aplicar automações e
            responder clientes com apoio de inteligência artificial.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">
            4. Cadastro
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Você deve ter ao menos 18 anos e capacidade civil plena.</li>
            <li>
              As informações fornecidas no cadastro devem ser verdadeiras,
              completas e atualizadas.
            </li>
            <li>
              Você é responsável pela confidencialidade das suas credenciais e
              por todas as atividades realizadas na sua conta.
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">
            5. Integração com Meta Platforms (Instagram, Facebook e WhatsApp)
          </h2>
          <p>
            Ao conectar contas do Instagram, Facebook ou WhatsApp Business à
            Synq, você:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              Declara ser titular das contas conectadas ou possuir autorização
              formal do titular.
            </li>
            <li>
              Concede à Synq autorização para, em seu nome, consumir as APIs
              oficiais da Meta no escopo das permissões aprovadas (incluindo{' '}
              <code>instagram_business_basic</code>,{' '}
              <code>instagram_business_manage_messages</code>,{' '}
              <code>instagram_business_manage_comments</code> e escopos
              equivalentes no Facebook e WhatsApp).
            </li>
            <li>
              Compromete-se a respeitar integralmente os{' '}
              <strong>Termos da Plataforma da Meta</strong>, a{' '}
              <strong>Política de Dados da Meta</strong>, as{' '}
              <strong>Community Guidelines</strong> do Instagram e os{' '}
              <strong>Termos do WhatsApp Business</strong>, inclusive regras de
              não envio de spam, respeito à janela de 24h do WhatsApp e proibição
              de automações abusivas.
            </li>
            <li>
              É o único responsável pelo conteúdo das mensagens, comentários,
              automações e campanhas que disparar por meio da plataforma.
            </li>
          </ul>
          <p>
            A Synq pode suspender ou remover integrações que violem as políticas
            da Meta, estes Termos ou a legislação aplicável.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">
            6. Uso permitido
          </h2>
          <p>Você se compromete a <strong>não</strong>:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Usar o serviço para envio de spam, phishing ou conteúdo ilícito.</li>
            <li>Praticar scraping, engenharia reversa ou circunvenção de controles técnicos.</li>
            <li>
              Coletar dados de usuários finais fora do escopo autorizado pelas
              APIs da Meta.
            </li>
            <li>
              Revender, sublicenciar ou oferecer o serviço a terceiros sem
              autorização.
            </li>
            <li>Ofender direitos de terceiros, inclusive propriedade intelectual.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">
            7. Planos, pagamento e cancelamento
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              Os planos, preços e limites vigentes estão publicados em{' '}
              <a
                href="https://www.synq.app.br"
                className="text-indigo-600 hover:text-indigo-700"
              >
                www.synq.app.br
              </a>
              .
            </li>
            <li>
              A cobrança é recorrente (mensal ou anual, conforme o plano) e
              realizada pelo gateway de pagamento contratado.
            </li>
            <li>
              Você pode cancelar a qualquer momento; o acesso permanece ativo
              até o fim do ciclo já pago, sem reembolso proporcional, salvo
              obrigação legal.
            </li>
            <li>
              O não pagamento autoriza a suspensão do acesso após notificação
              prévia.
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">
            8. Propriedade intelectual
          </h2>
          <p>
            Todos os direitos sobre o software, marca, interface, código-fonte e
            conteúdos originais da Synq pertencem à controladora. Você mantém a
            titularidade sobre os dados e conteúdos que inserir na plataforma,
            concedendo à Synq licença não exclusiva apenas para viabilizar a
            prestação do serviço.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">
            9. Disponibilidade e limitação de responsabilidade
          </h2>
          <p>
            Envidamos esforços razoáveis para manter a plataforma disponível,
            mas não garantimos operação ininterrupta. A Synq não se responsabiliza
            por:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Indisponibilidade causada por APIs de terceiros (Meta, WhatsApp, etc.).</li>
            <li>Bloqueios, suspensões ou restrições impostas pela Meta à conta do usuário.</li>
            <li>
              Danos indiretos, lucros cessantes ou perda de oportunidade, na
              máxima extensão permitida pela lei brasileira.
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">
            10. Rescisão
          </h2>
          <p>
            A Synq pode encerrar ou suspender contas que descumpram estes
            Termos, as políticas da Meta ou a legislação aplicável,
            independentemente de aviso prévio em casos de infração grave.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">
            11. Proteção de dados
          </h2>
          <p>
            O tratamento de dados pessoais é regido pela nossa{' '}
            <Link
              href="/privacidade"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Política de Privacidade
            </Link>
            , que integra estes Termos.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">
            12. Alterações
          </h2>
          <p>
            Estes Termos podem ser atualizados; a versão em vigor é sempre a
            publicada nesta URL. Mudanças relevantes serão comunicadas por
            e-mail ou dentro da plataforma.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">
            13. Lei aplicável e foro
          </h2>
          <p>
            Estes Termos são regidos pelas leis da República Federativa do
            Brasil. Fica eleito o foro do domicílio do consumidor para
            relações de consumo, e o foro da comarca da sede da controladora
            para demais casos, com renúncia expressa a qualquer outro.
          </p>
        </section>
      </div>
    </div>
  );
}
