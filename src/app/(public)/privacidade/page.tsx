import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Privacidade — Synq',
  description:
    'Política de Privacidade da plataforma Synq, operada por 54.623.148 VINICIOS COELHO FELIPE DA COSTA (CNPJ 54.623.148/0001-01). Como coletamos, usamos e protegemos seus dados, inclusive dados obtidos via Meta Platforms (Instagram, Facebook e WhatsApp).',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://www.synq.app.br/privacidade' },
};

export default function PrivacidadePage() {
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
          Política de Privacidade
        </h1>
        <p className="text-sm text-slate-500 mb-10">
          Última atualização: 23 de abril de 2026
          <br />
          Vigência: a partir de 23 de abril de 2026
        </p>

        <section className="prose prose-slate max-w-none space-y-6 text-slate-700 leading-relaxed">
          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">
            1. Identificação do Controlador de Dados
          </h2>
          <p>
            A plataforma <strong>Synq</strong> (“Synq”, “plataforma”, “aplicação”,
            “nós”) é de propriedade e operada por:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Razão social:</strong> 54.623.148 VINICIOS COELHO FELIPE DA
              COSTA
            </li>
            <li>
              <strong>CNPJ:</strong> 54.623.148/0001-01
            </li>
            <li>
              <strong>Nome fantasia / marca:</strong> Synq
            </li>
            <li>
              <strong>Site oficial:</strong>{' '}
              <a
                href="https://www.synq.app.br"
                className="text-indigo-600 hover:text-indigo-700"
              >
                https://www.synq.app.br
              </a>
            </li>
            <li>
              <strong>E-mail de contato (Encarregado / DPO):</strong>{' '}
              <a
                href="mailto:suporte.synq@proton.me"
                className="text-indigo-600 hover:text-indigo-700"
              >
                suporte.synq@proton.me
              </a>
            </li>
          </ul>
          <p>
            Esta Política de Privacidade descreve como a Synq trata os dados
            pessoais coletados por meio da aplicação em conformidade com a{' '}
            <strong>
              Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 —
              LGPD)
            </strong>
            , com os{' '}
            <strong>Termos da Plataforma da Meta (seção 4.a e 5)</strong>, com as
            políticas do <strong>Meta App Review</strong>, da{' '}
            <strong>Instagram Graph API</strong> e da{' '}
            <strong>WhatsApp Business Platform</strong>.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">
            2. Sobre o Synq
          </h2>
          <p>
            Synq é uma plataforma SaaS (Software as a Service) brasileira de
            atendimento inteligente que permite a empresas centralizar, responder
            e automatizar conversas em canais como{' '}
            <strong>Instagram Direct</strong>, <strong>comentários do Instagram</strong>,{' '}
            <strong>WhatsApp Business</strong> e outros, com uso de inteligência
            artificial para apoio a campanhas, vendas e suporte.
          </p>
          <p>
            Para funcionar, o Synq se integra a APIs oficiais da Meta Platforms,
            Inc. (Facebook, Instagram e WhatsApp). O uso dessas APIs é feito
            exclusivamente em nome do usuário que conecta sua própria conta
            comercial, mediante autorização expressa via OAuth.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">
            3. Dados que coletamos
          </h2>

          <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-2">
            3.1. Dados fornecidos diretamente por você
          </h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Nome, e-mail, telefone, CPF/CNPJ e endereço (cadastro e faturamento).</li>
            <li>Credenciais de acesso (senha criptografada por hash).</li>
            <li>Dados de pagamento, processados por gateway externo (não armazenamos dados completos de cartão).</li>
            <li>Conteúdo que você envia pela plataforma, incluindo mensagens, campanhas e regras de automação.</li>
          </ul>

          <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-2">
            3.2. Dados obtidos via Meta Platforms (Instagram, Facebook e WhatsApp)
          </h3>
          <p>
            Ao conectar sua conta comercial do Instagram, Facebook ou WhatsApp
            Business ao Synq, coletamos — estritamente no escopo autorizado por
            você via fluxo OAuth oficial da Meta — os seguintes dados:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Identificador e metadados da conta comercial</strong> (ID,
              nome de usuário, foto de perfil, tipo de conta Business/Creator).
            </li>
            <li>
              <strong>Mensagens diretas (DMs)</strong> enviadas e recebidas no
              Instagram Direct e no WhatsApp Business, contendo texto, mídia,
              identificador do remetente e carimbo de data/hora.
            </li>
            <li>
              <strong>Comentários em publicações do Instagram</strong> da sua
              própria conta, incluindo texto do comentário, identificador do
              autor e carimbo de data/hora.
            </li>
            <li>
              <strong>Metadados de publicações</strong> de mídia da sua conta
              (ID da mídia, legenda, data de publicação) apenas para exibir
              contexto sobre o comentário ou mensagem recebida.
            </li>
            <li>
              <strong>Tokens de acesso</strong> OAuth, armazenados de forma
              criptografada, utilizados apenas para chamadas autorizadas às APIs
              da Meta.
            </li>
          </ul>
          <p>
            <strong>Não coletamos</strong> dados pessoais de usuários finais além
            do necessário para viabilizar a conversa ou o comentário, não
            acessamos caixas de entrada de contas pessoais (apenas contas
            Business/Creator conectadas pelo próprio titular) e não extraímos
            listas de amigos, seguidores ou contatos fora do escopo estritamente
            necessário ao recurso solicitado.
          </p>

          <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-2">
            3.3. Dados coletados automaticamente
          </h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Endereço IP, tipo de navegador, sistema operacional e dispositivo.</li>
            <li>Logs de acesso, data e hora, e páginas visitadas.</li>
            <li>Cookies e identificadores semelhantes (ver seção 10).</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">
            4. Uso específico das permissões da Meta
          </h2>
          <p>
            A Synq solicita as seguintes permissões junto à Meta, com
            justificativa individualizada:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>instagram_business_basic</strong> — usada para identificar
              a conta comercial conectada e exibir ao usuário quais contas estão
              vinculadas ao Synq.
            </li>
            <li>
              <strong>instagram_business_manage_messages</strong> — usada para
              ler, responder e organizar mensagens do Instagram Direct dentro do
              Synq, exclusivamente quando o usuário dono da conta autoriza.
            </li>
            <li>
              <strong>instagram_business_manage_comments</strong> — usada para
              listar, responder, ocultar e moderar comentários em publicações da
              conta comercial do próprio usuário, possibilitando respostas
              manuais e automações de atendimento que ele configurar.
            </li>
            <li>
              <strong>pages_manage_metadata / pages_messaging</strong> (Facebook)
              — quando aplicável, para gerenciar mensagens e metadados de
              páginas conectadas.
            </li>
            <li>
              <strong>whatsapp_business_messaging / whatsapp_business_management</strong>{' '}
              — usadas para envio e recebimento de mensagens via WhatsApp
              Business Platform, estritamente nas contas autorizadas pelo
              usuário.
            </li>
          </ul>
          <p>
            Nenhum dado obtido via APIs da Meta é usado para treinar modelos de
            IA genéricos, vendido a terceiros ou utilizado para fins diferentes
            daqueles descritos nesta política.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">
            5. Como usamos os dados
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Fornecer, operar e manter a plataforma Synq.</li>
            <li>
              Permitir que você visualize, responda e automatize conversas e
              comentários das suas contas conectadas.
            </li>
            <li>Emitir notas fiscais, processar pagamentos e prevenir fraude.</li>
            <li>Prestar suporte técnico e comunicar atualizações do serviço.</li>
            <li>
              Gerar métricas agregadas e anonimizadas para melhoria do produto.
            </li>
            <li>Cumprir obrigações legais e regulatórias.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">
            6. Compartilhamento de dados
          </h2>
          <p>
            A Synq <strong>não vende</strong> dados pessoais. Podemos compartilhar
            dados apenas:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              Com provedores de infraestrutura (hospedagem em nuvem, e-mail
              transacional, gateway de pagamento), sob contrato de operador de
              dados e cláusulas de confidencialidade.
            </li>
            <li>
              Com a própria Meta Platforms, quando a operação solicitada pelo
              usuário exige chamada à API (por exemplo, publicar uma resposta a
              um comentário).
            </li>
            <li>
              Por obrigação legal, ordem judicial ou solicitação de autoridade
              competente.
            </li>
            <li>
              Em caso de reestruturação societária, com notificação prévia aos
              titulares.
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">
            7. Armazenamento, retenção e segurança
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              Dados são armazenados em servidores localizados em data centers com
              certificações ISO 27001 e SOC 2, preferencialmente em região do
              Brasil ou Estados Unidos.
            </li>
            <li>
              Tokens de acesso da Meta são criptografados em repouso (AES-256) e
              em trânsito (TLS 1.2+).
            </li>
            <li>
              Mensagens e comentários coletados são retidos enquanto a conta
              estiver ativa e por até 30 dias após a desconexão da integração
              ou o encerramento da conta, salvo obrigação legal de retenção maior
              (fiscal/tributária).
            </li>
            <li>
              Aplicamos controles de acesso mínimo (princípio do menor
              privilégio), trilhas de auditoria e monitoramento contínuo.
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">
            8. Seus direitos como titular (LGPD, art. 18)
          </h2>
          <p>Você pode, a qualquer momento, solicitar:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Confirmação da existência de tratamento.</li>
            <li>Acesso aos seus dados.</li>
            <li>Correção de dados incompletos, inexatos ou desatualizados.</li>
            <li>Anonimização, bloqueio ou eliminação de dados desnecessários.</li>
            <li>Portabilidade.</li>
            <li>Eliminação dos dados tratados com base no consentimento.</li>
            <li>Informações sobre compartilhamentos.</li>
            <li>Revogação do consentimento.</li>
          </ul>
          <p>
            Para exercer esses direitos, envie um e-mail para{' '}
            <a
              href="mailto:suporte.synq@proton.me"
              className="text-indigo-600 hover:text-indigo-700"
            >
              suporte.synq@proton.me
            </a>
            . Responderemos em até 15 dias corridos.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">
            9. Exclusão de dados e desconexão de integrações Meta
          </h2>
          <p>
            Você pode, a qualquer momento, remover seus dados pelos seguintes
            caminhos:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Remover dados da conta (mantendo a assinatura):</strong>{' '}
              dentro do Synq, em{' '}
              <em>Configurações → aba “Conta” → Zona de Perigo → “Limpar Dados”</em>.
              Essa ação apaga de forma irreversível todo o histórico de
              contatos, mensagens, interações, campanhas, grupos, tags e
              regras de resposta automática obtidos via
              Instagram/Facebook/WhatsApp.
            </li>
            <li>
              <strong>Excluir conta inteira (remoção total):</strong> dentro do
              Synq, em{' '}
              <em>Configurações → aba “Conta” → Zona de Perigo → “Excluir Conta”</em>.
              Encerra a assinatura, faz logout imediato, apaga os canais
              conectados e os tokens de acesso armazenados, e remove
              permanentemente todos os dados associados.
            </li>
            <li>
              <strong>Revogar o Synq direto na Meta:</strong> em{' '}
              <em>Configurações → Apps e sites</em> no Facebook ou Instagram —
              essa é a forma mais definitiva de invalidar o acesso do nosso
              app à sua conta pelo lado da própria Meta.
            </li>
            <li>
              <strong>Por e-mail</strong> (útil para quem perdeu acesso à
              conta): envie mensagem para{' '}
              <a
                href="mailto:suporte.synq@proton.me"
                className="text-indigo-600 hover:text-indigo-700"
              >
                suporte.synq@proton.me
              </a>{' '}
              com o assunto “Exclusão de Dados”.
            </li>
          </ul>
          <p>
            Instruções detalhadas, passo a passo e prazos estão na página{' '}
            <Link
              href="/exclusao-de-dados"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Exclusão de Dados
            </Link>
            . A exclusão completa é concluída em até 30 dias e abrange bases
            primárias e backups, exceto quando a retenção for exigida por lei
            (ex.: obrigações fiscais).
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">
            10. Cookies
          </h2>
          <p>
            Usamos cookies estritamente necessários para autenticação e
            funcionamento da plataforma, e cookies analíticos agregados para
            entender o uso do produto. Você pode desativá-los no seu navegador,
            sabendo que isso pode afetar o funcionamento de algumas
            funcionalidades.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">
            11. Transferência internacional
          </h2>
          <p>
            Alguns provedores (ex.: Meta Platforms, Inc.) estão sediados fora do
            Brasil. Sempre que houver transferência internacional, garantimos
            salvaguardas adequadas conforme o art. 33 da LGPD.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">
            12. Alterações nesta política
          </h2>
          <p>
            Podemos atualizar esta política periodicamente. A versão vigente é a
            publicada nesta URL, com a data de “Última atualização” indicada no
            topo. Mudanças relevantes serão comunicadas por e-mail e/ou aviso
            dentro da plataforma.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">
            13. Contato e Encarregado pelo Tratamento de Dados (DPO)
          </h2>
          <p>
            <strong>Controlador:</strong> 54.623.148 VINICIOS COELHO FELIPE DA
            COSTA — CNPJ 54.623.148/0001-01
            <br />
            <strong>Encarregado (DPO) / Contato de privacidade:</strong>{' '}
            <a
              href="mailto:suporte.synq@proton.me"
              className="text-indigo-600 hover:text-indigo-700"
            >
              suporte.synq@proton.me
            </a>
          </p>
          <p>
            Em caso de conflito não resolvido, você também pode acionar a{' '}
            <strong>
              Autoridade Nacional de Proteção de Dados (ANPD) — www.gov.br/anpd
            </strong>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
