import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Exclusão de Dados — Synq',
  description:
    'Instruções para remover os dados da sua conta Synq e revogar as integrações Meta (Instagram, Facebook, WhatsApp). Operado por 54.623.148 VINICIOS COELHO FELIPE DA COSTA (CNPJ 54.623.148/0001-01).',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://www.synq.app.br/exclusao-de-dados' },
};

export default function ExclusaoDeDadosPage() {
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
          Exclusão de Dados
        </h1>
        <p className="text-sm text-slate-500 mb-10">
          Última atualização: 23 de abril de 2026
        </p>

        <section className="prose prose-slate max-w-none space-y-6 text-slate-700 leading-relaxed">
          <p>
            A plataforma <strong>Synq</strong>, operada por{' '}
            <strong>54.623.148 VINICIOS COELHO FELIPE DA COSTA</strong> — CNPJ{' '}
            <strong>54.623.148/0001-01</strong>, respeita o direito do titular à
            eliminação dos seus dados pessoais, nos termos da{' '}
            <strong>LGPD (Lei 13.709/2018)</strong> e dos{' '}
            <strong>Termos da Plataforma da Meta (seção 4.a / 5)</strong>.
          </p>
          <p>
            Você tem <strong>três caminhos</strong> para remover seus dados e
            revogar as integrações com Instagram, Facebook e WhatsApp
            conectadas ao Synq. Qualquer um deles satisfaz o requisito de
            exclusão de dados da Meta e da LGPD.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">
            Opção 1 — Remover dados da conta (mantém a assinatura ativa)
          </h2>
          <p>
            Útil quando você quer <em>limpar o histórico</em> (mensagens,
            contatos, campanhas e grupos obtidos via Instagram/WhatsApp) mas
            continuar usando a plataforma.
          </p>
          <ol className="list-decimal pl-6 space-y-1">
            <li>
              Acesse{' '}
              <a
                href="https://www.synq.app.br"
                className="text-indigo-600 hover:text-indigo-700"
              >
                www.synq.app.br
              </a>{' '}
              e entre na sua conta.
            </li>
            <li>
              No menu, clique em{' '}
              <strong>Configurações → aba “Conta”</strong>.
            </li>
            <li>
              Role até a seção <strong>Zona de Perigo</strong>.
            </li>
            <li>
              Clique em <strong>“Limpar Dados”</strong> sob a opção{' '}
              <em>“Remover Dados da Conta — Apaga histórico de mensagens e
              contatos. Irreversível.”</em>
            </li>
            <li>Confirme a operação no modal que abrir.</li>
          </ol>
          <p>
            <strong>O que é apagado imediatamente:</strong> contatos, histórico
            de mensagens do Instagram Direct e do WhatsApp, comentários
            armazenados, campanhas e grupos. A ação é{' '}
            <strong>irreversível</strong> e não pode ser desfeita.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">
            Opção 2 — Excluir conta inteira (recomendada para exclusão total)
          </h2>
          <p>
            Essa é a forma completa de exclusão — apaga todos os dados,
            encerra a assinatura e revoga todas as integrações com a Meta.
          </p>
          <ol className="list-decimal pl-6 space-y-1">
            <li>
              Acesse{' '}
              <a
                href="https://www.synq.app.br"
                className="text-indigo-600 hover:text-indigo-700"
              >
                www.synq.app.br
              </a>{' '}
              e entre na sua conta.
            </li>
            <li>
              Vá em <strong>Configurações → aba “Conta” → Zona de Perigo</strong>.
            </li>
            <li>
              Clique em <strong>“Excluir Conta”</strong> sob a opção{' '}
              <em>“Excluir Conta — Encerra assinatura e remove todos os
              acessos.”</em>
            </li>
            <li>Confirme no modal. Você será deslogado imediatamente.</li>
          </ol>
          <p>
            <strong>O que acontece:</strong>
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              A conta Synq é excluída permanentemente, junto com dados de
              cadastro, canais conectados, tokens de acesso armazenados (do
              Instagram, Facebook e WhatsApp), contatos, mensagens, interações,
              campanhas, grupos, tags e regras de automação.
            </li>
            <li>
              Os tokens OAuth armazenados pela Synq são apagados do nosso
              banco de dados, interrompendo qualquer chamada futura da Synq às
              APIs da Meta em seu nome. Caso você queira também invalidar o
              acesso no lado da Meta de forma definitiva, basta remover a
              Synq nas configurações do Facebook/Instagram (ver próxima seção).
            </li>
            <li>
              A assinatura é encerrada e não são cobradas novas mensalidades.
            </li>
            <li>
              Remoção completa (incluindo backups) em até 30 dias, salvo dados
              que, por obrigação legal (ex.: fiscal/tributária), precisem ser
              retidos em ambiente segregado e sem uso para outras finalidades.
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">
            Opção 3 — Solicitação por e-mail
          </h2>
          <p>
            Se você <strong>perdeu o acesso à sua conta</strong> ou precisa
            remover dados de uma conta que não é mais sua (ex.: ex-funcionário,
            empresa encerrada), envie um e-mail para:
          </p>
          <p>
            <a
              href="mailto:suporte.synq@proton.me"
              className="text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              suporte.synq@proton.me
            </a>
            {' '}— assunto: <strong>“Exclusão de Dados”</strong>
          </p>
          <p>Inclua no e-mail:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Nome completo e e-mail cadastrado no Synq.</li>
            <li>
              Se aplicável: ID ou @ da conta do Instagram/Facebook/WhatsApp
              Business que estava conectada.
            </li>
            <li>Breve comprovação de titularidade (quando possível).</li>
            <li>Confirmação de que deseja excluir todos os dados.</li>
          </ul>
          <p>
            Responderemos com um <strong>código de confirmação</strong> em até
            15 dias corridos, e a remoção total (incluindo backups) é concluída
            em até 30 dias corridos.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">
            Revogando o Synq direto no Facebook/Instagram
          </h2>
          <p>
            Independentemente das opções acima, você pode revogar a
            autorização do Synq pelo próprio Facebook/Instagram a qualquer
            momento:
          </p>
          <ol className="list-decimal pl-6 space-y-1">
            <li>
              No Facebook: <em>Configurações → Apps e sites → Logado com o
              Facebook</em> → localize <strong>Synq</strong> → clique em{' '}
              <strong>Remover</strong>.
            </li>
            <li>
              No Instagram: <em>Configurações → Apps e sites → Ativos</em> →
              localize <strong>Synq</strong> → clique em{' '}
              <strong>Remover</strong>.
            </li>
          </ol>
          <p>
            Ao remover a Synq pelo painel da Meta, o acesso às suas contas é
            imediatamente interrompido. Para apagar também os dados já
            armazenados na Synq, utilize qualquer uma das três opções acima.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">
            Contato do Encarregado (DPO)
          </h2>
          <p>
            <strong>Controlador:</strong> 54.623.148 VINICIOS COELHO FELIPE DA
            COSTA — CNPJ 54.623.148/0001-01
            <br />
            <strong>Encarregado (DPO):</strong>{' '}
            <a
              href="mailto:suporte.synq@proton.me"
              className="text-indigo-600 hover:text-indigo-700"
            >
              suporte.synq@proton.me
            </a>
          </p>
          <p>
            Você também pode acionar, se preferir, a{' '}
            <strong>
              Autoridade Nacional de Proteção de Dados (ANPD) —
              www.gov.br/anpd
            </strong>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
