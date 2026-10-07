import type { BusinessType } from '@/types/BusinessType';
import { HIDDEN_FEATURES, LOCKED_FEATURES } from '@lib/featureFlags';

export type HelpCategory = 'channels' | 'automations' | 'ai' | 'sales' | 'contacts' | 'account';

export interface HelpArticleLink {
  href: string;
  label: string;
}

export interface HelpArticle {
  id: string;
  title: string;
  summary: string;
  category: HelpCategory;
  steps: string[];
  tip?: string;
  link: HelpArticleLink;
  keywords: string[];
  routes: string[];
  audiences?: BusinessType[];
  featured?: boolean;
  available?: boolean;
}

export const HELP_CATEGORIES: { id: HelpCategory; label: string }[] = [
  { id: 'channels', label: 'WhatsApp e Instagram' },
  { id: 'automations', label: 'Automações' },
  { id: 'ai', label: 'Inteligência Artificial' },
  { id: 'sales', label: 'Vendas e campanhas' },
  { id: 'contacts', label: 'Contatos e conversas' },
  { id: 'account', label: 'Conta, equipe e plano' },
];

const ALL_HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'conectar-whatsapp-qr',
    title: 'Conectar o WhatsApp pelo QR Code',
    summary: 'Ligue o número do seu negócio ao Synq usando a câmera do celular. Leva cerca de um minuto.',
    category: 'channels',
    steps: [
      'Abra Canais no menu.',
      'No quadro WhatsApp, toque em Conectar número. Se ainda não tiver nenhum número, escolha WhatsApp pelo QR Code no quadro Qual WhatsApp é para mim?.',
      'Em Como você prefere conectar?, escolha Escanear QR Code e toque em Mostrar QR Code.',
      'No celular, abra o WhatsApp e toque em Mais opções (Android) ou em Configurações (iPhone).',
      'Entre em Aparelhos conectados e toque em Conectar um aparelho.',
      'Aponte a câmera do celular para o QR Code da tela. Quando terminar, o número aparece como Ativo.',
    ],
    tip: 'Use o celular do próprio número que você quer conectar. A tela se atualiza sozinha quando a conexão termina.',
    link: { href: '/channels', label: 'Canais' },
    keywords: ['qr', 'qr code', 'qrcode', 'conectar', 'ligar', 'whatsapp', 'numero', 'celular', 'escanear', 'camera', 'aparelhos conectados'],
    routes: ['/channels', '/dashboard'],
    featured: true,
  },
  {
    id: 'conectar-whatsapp-codigo',
    title: 'Conectar o WhatsApp com um código (sem QR Code)',
    summary: 'Está usando o Synq pelo celular ou a câmera não lê o QR Code? Conecte digitando um código no WhatsApp.',
    category: 'channels',
    steps: [
      'Abra Canais no menu e, no quadro WhatsApp, toque em Conectar número.',
      'Em Como você prefere conectar?, escolha Receber um código e toque em Continuar.',
      'Digite o número do WhatsApp com DDD e toque em Gerar código.',
      'No celular, abra o WhatsApp, toque em Mais opções ou em Configurações e entre em Aparelhos conectados.',
      'Toque em Conectar um aparelho e depois em Conectar com número de telefone.',
      'Digite no WhatsApp o código que apareceu no Synq. Se preferir, copie o código pelo botão da tela.',
    ],
    tip: 'O número digitado no Synq precisa ser o mesmo do WhatsApp onde você vai colocar o código.',
    link: { href: '/channels', label: 'Canais' },
    keywords: ['codigo', 'codigo de pareamento', 'pareamento', 'sem qr', 'nao le', 'camera', 'celular', 'conectar com numero de telefone', 'whatsapp'],
    routes: ['/channels'],
  },
  {
    id: 'conectar-instagram',
    title: 'Conectar o Instagram (conta profissional)',
    summary: 'Para o Synq responder Direct e comentários, a conta do Instagram precisa ser profissional: Comercial ou Criador de conteúdo.',
    category: 'channels',
    steps: [
      'No app do Instagram, abra o seu perfil, toque no menu (as três linhas no canto de cima) e entre em Tipo de conta e ferramentas. Se a conta for pessoal, toque em Mudar para conta profissional e escolha Comercial ou Criador de conteúdo. É grátis.',
      'Ainda no app, entre em Mensagens e respostas a stories, depois em Ferramentas de mensagens, e ligue Permitir acesso a mensagens.',
      'No Synq, abra Canais e, no quadro Instagram, toque em Conectar conta.',
      'Na janela Antes de conectar o Instagram, toque em Minha conta já é profissional.',
      'Na janela que abrir, entre com o usuário e a senha do Instagram e autorize o acesso.',
      'Pronto: a conta aparece no quadro Instagram e já pode ser usada nas automações.',
    ],
    tip: 'Se a janela de login não abrir, libere as janelas pop-up do navegador para o Synq e tente de novo.',
    link: { href: '/channels', label: 'Canais' },
    keywords: ['instagram', 'insta', 'conta profissional', 'comercial', 'criador', 'criador de conteudo', 'direct', 'dm', 'conectar', 'login', 'meta', 'facebook'],
    routes: ['/channels', '/auto-replies'],
    featured: true,
    audiences: ['ecommerce', 'infoproduct'],
  },
  {
    id: 'qual-whatsapp-escolher',
    title: 'WhatsApp pelo QR Code ou WhatsApp Oficial: qual escolher?',
    summary: 'Os dois funcionam no Synq. A diferença está em como o número é ligado e no que cada um permite.',
    category: 'channels',
    steps: [
      'WhatsApp pelo QR Code: você conecta em um minuto o número que já usa no celular. É o melhor para atender e responder clientes automaticamente.',
      'WhatsApp Oficial: é o WhatsApp da Meta (dona do WhatsApp) para empresas. É o caminho para mandar promoções para muitos contatos com menos risco de bloqueio.',
      'No WhatsApp Oficial, para chamar um cliente que não fala com você há mais de 24h, você usa um modelo de mensagem aprovado pela Meta. Quando o cliente fala com você, as respostas ficam livres por 24 horas.',
      'O WhatsApp Oficial exige uma conta de empresa na Meta, e a Meta cobra pelas mensagens enviadas. Você acompanha o consumo na tela WhatsApp Oficial.',
      'Na dúvida, comece pelo QR Code. Você pode adicionar o WhatsApp Oficial depois, sem perder nada. Em Canais, o botão Qual WhatsApp é para mim? ajuda a decidir.',
    ],
    link: { href: '/channels', label: 'Canais' },
    keywords: ['qual whatsapp', 'escolher', 'diferenca', 'oficial', 'api', 'api oficial', 'meta', 'comum', 'qr code', 'business', 'bloqueio'],
    routes: ['/channels', '/whatsapp-official', '/campaigns'],
  },
  {
    id: 'whatsapp-oficial-modelos',
    title: 'WhatsApp Oficial e modelos de mensagem aprovados',
    summary: 'No WhatsApp Oficial, a primeira mensagem para um cliente usa um modelo de mensagem aprovado pela Meta.',
    category: 'channels',
    steps: [
      'Em Canais, no quadro WhatsApp Oficial, toque em Conectar número.',
      'Escolha se é um número que você já usa no WhatsApp Business ou um número novo, e siga a janela da Meta até o fim.',
      'Abra WhatsApp Oficial no menu e, no quadro Modelos de mensagem, toque em Ver todos.',
      'Toque em Novo modelo, escreva o texto e toque em Enviar para aprovação.',
      'Espere a Meta aprovar. Depois de aprovado, o modelo aparece para escolher nas campanhas.',
    ],
    tip: 'Mensagens muito promocionais ou com links estranhos costumam ser recusadas. Escreva de forma clara e diga quem está enviando.',
    link: { href: '/templates', label: 'Modelos de mensagem' },
    keywords: ['oficial', 'whatsapp oficial', 'api oficial', 'modelo', 'modelos', 'modelo de mensagem', 'template', 'aprovado', 'aprovacao', 'meta', 'recusado', 'whatsapp business'],
    routes: ['/whatsapp-official', '/templates', '/campaigns'],
  },
  {
    id: 'canal-desconectado',
    title: 'Meu WhatsApp desconectou. E agora?',
    summary: 'Às vezes o WhatsApp desconecta (troca de celular, app reinstalado ou muito tempo sem internet). Reconectar é rápido.',
    category: 'channels',
    steps: [
      'Abra Canais no menu.',
      'No quadro WhatsApp, procure o número marcado como Desconectado ou Parado.',
      'Toque em Reconectar, ao lado do número.',
      'Leia o novo QR Code com o WhatsApp do celular, em Aparelhos conectados, ou use o código que aparecer.',
      'Quando o número voltar para Ativo, as automações e a IA voltam a responder sozinhas.',
    ],
    tip: 'Se o número continuar parado, remova a conexão antiga e conecte o número de novo. Seus contatos e automações continuam no Synq.',
    link: { href: '/channels', label: 'Canais' },
    keywords: ['desconectou', 'desconectado', 'caiu', 'parado', 'offline', 'nao funciona', 'parou', 'reconectar', 'whatsapp', 'qr code', 'instagram expirado'],
    routes: ['/channels', '/dashboard', '/inbox'],
  },
  {
    id: 'automacao-comentario-direct',
    title: 'Primeira automação: comentou, recebeu o link no Direct',
    summary: 'Quem comentar uma palavra no seu post recebe na hora o link no Direct, e você ainda pode responder no comentário.',
    category: 'automations',
    steps: [
      'Conecte sua conta do Instagram em Canais (precisa ser conta profissional).',
      'Abra Automações no menu. Em O que você quer automatizar?, escolha Mandar o link para quem comentar, ou toque em Criar do zero e depois em Comentário.',
      'Em Quando responder?, escreva a palavra que as pessoas vão comentar (ex.: QUERO).',
      'Em O que responder?, escreva a Mensagem no Direct e coloque o link da oferta. Se quiser, marque Responder também no comentário.',
      'Em Onde vale?, escolha a conta do Instagram e se vale para Todos os posts ou Só alguns posts.',
      'Use Testar antes de ativar para conferir e toque em Salvar e ativar.',
    ],
    tip: 'Na legenda do post, avise: “Comente QUERO que eu te mando o link no Direct”. Isso multiplica os comentários.',
    link: { href: '/auto-replies?tipo=comentario', label: 'Automações' },
    keywords: ['comentario', 'comentar', 'post', 'link', 'direct', 'dm', 'instagram', 'palavra-chave', 'quero', 'automacao', 'primeira automacao'],
    routes: ['/auto-replies', '/dashboard'],
    featured: true,
    audiences: ['ecommerce', 'infoproduct'],
  },
  {
    id: 'automacao-palavra-chave',
    title: 'Responder sozinho quando o cliente manda uma palavra',
    summary: 'Quando alguém escrever “preço”, “horário” ou “endereço”, o Synq responde na hora, de dia ou de noite.',
    category: 'automations',
    steps: [
      'Abra Automações no menu. Em O que você quer automatizar?, escolha um objetivo pronto, como Responder endereço e horário ou Mandar o catálogo ou cardápio. Ou toque em Criar do zero e escolha Mensagem direta.',
      'Em Quando responder?, digite as palavras que fazem a resposta sair (ex.: preço, valor, quanto custa).',
      'Em O que responder?, escreva a resposta. Se quiser, coloque um link ou anexe uma imagem, um áudio ou um documento.',
      'Em Onde vale?, escolha o número do WhatsApp ou a conta do Instagram que vai responder.',
      'Use Testar antes de ativar para conferir e toque em Salvar e ativar. A partir daí, a resposta sai sozinha.',
    ],
    tip: 'Coloque várias formas de perguntar a mesma coisa: “preço”, “valor” e “quanto custa”. O jeito de comparar as palavras já vem pronto; só mude em Mais opções se precisar.',
    link: { href: '/auto-replies?tipo=mensagem', label: 'Automações' },
    keywords: ['resposta automatica', 'auto resposta', 'palavra', 'palavra-chave', 'responder sozinho', 'preco', 'horario', 'whatsapp', 'automacao', 'bot'],
    routes: ['/auto-replies', '/dashboard'],
    featured: true,
    audiences: ['local', 'ecommerce'],
  },
  {
    id: 'automacao-live',
    title: 'Automação para lives do Instagram',
    summary: 'Durante a live, quem comentar a palavra combinada recebe uma mensagem no Direct e, se você quiser, uma resposta no chat da transmissão.',
    category: 'automations',
    steps: [
      'Abra Automações no menu. Em O que você quer automatizar?, escolha Mandar o link durante a live, ou toque em Criar do zero e escolha Live.',
      'Em Quando responder?, digite a palavra que você vai pedir na live (ex.: EU QUERO).',
      'Em O que responder?, escreva a Mensagem no Direct com o link da oferta.',
      'Se quiser, marque Responder também no chat da live e escreva a resposta que todo mundo vai ver.',
      'Em Onde vale?, escolha a conta do Instagram.',
      'Toque em Salvar e ativar antes de começar a live.',
    ],
    tip: 'Durante a live, repita a palavra em voz alta e escreva na tela. Quanto mais simples a palavra, mais gente comenta.',
    link: { href: '/auto-replies?tipo=live', label: 'Automações' },
    keywords: ['live', 'ao vivo', 'transmissao', 'lancamento', 'instagram', 'comentario', 'direct', 'automacao'],
    routes: ['/auto-replies'],
    audiences: ['infoproduct'],
  },
  {
    id: 'ia-modo-simples',
    title: 'Ligar a IA em poucos minutos (modo simples)',
    summary: 'Responda 3 perguntas sobre o seu negócio, escolha onde a IA atende e ela começa a responder seus clientes sozinha.',
    category: 'ai',
    steps: [
      'Antes, conecte o WhatsApp ou o Instagram em Canais.',
      'Abra Inteligência Artificial no menu. Se a tela abrir em Configurações avançadas, toque em Modo simples, no alto da página.',
      'Responda as 3 perguntas: o que você vende ou faz, o seu horário de atendimento e onde o cliente vê os preços.',
      'Toque em Salvar respostas.',
      'Em Canais atendidos pela IA, ligue a chave do número ou da conta onde a IA vai responder.',
      'No quadro Teste sua IA (ao lado, ou mais abaixo no celular), converse como se fosse um cliente para ver como ela responde.',
    ],
    tip: 'Ligue primeiro em um número só e teste com calma antes de liberar para todos os clientes.',
    link: { href: '/ia', label: 'Inteligência Artificial' },
    keywords: ['ia', 'inteligencia artificial', 'robo', 'bot', 'chatbot', 'modo simples', 'ligar ia', 'ativar', 'atender', 'responder sozinho', 'configurar'],
    routes: ['/ia', '/dashboard'],
    featured: true,
  },
  {
    id: 'ia-testar-simulador',
    title: 'Testar a IA antes de liberar para os clientes',
    summary: 'Converse com a sua IA como se você fosse um cliente. Nada é enviado de verdade para ninguém.',
    category: 'ai',
    steps: [
      'Abra Inteligência Artificial no menu.',
      'No Modo simples, use o quadro Teste sua IA, ao lado das perguntas. Nas Configurações avançadas, abra a aba Testar conversa.',
      'Escreva uma pergunta como um cliente escreveria, por exemplo: “Quanto custa?” ou “Vocês abrem sábado?”.',
      'Veja a resposta. Se algo estiver errado, ajuste as respostas sobre o seu negócio e salve.',
      'Toque em Recomeçar para testar uma conversa nova do zero.',
    ],
    tip: 'Teste as 5 perguntas que você mais recebe no dia a dia. Se a IA acertar essas, ela já está pronta para atender.',
    link: { href: '/ia', label: 'Inteligência Artificial' },
    keywords: ['testar', 'teste', 'simulador', 'simular', 'conversa de teste', 'ia', 'inteligencia artificial', 'experimentar', 'ver resposta'],
    routes: ['/ia'],
  },
  {
    id: 'ia-ensinar-negocio',
    title: 'Ensinar mais sobre o seu negócio para a IA',
    summary: 'Cadastre produtos, preços e as dúvidas mais comuns. A IA usa isso para responder com mais precisão.',
    category: 'ai',
    steps: [
      'Abra Inteligência Artificial no menu e toque em Configurações avançadas.',
      'Na aba Geral, confira o nome do negócio, o segmento e o tom de voz.',
      'Na aba Catálogo, cadastre seus produtos ou serviços com preço.',
      'Na aba Conhecimento, cadastre as perguntas que os clientes mais fazem e as respostas certas.',
      'Ainda em Conhecimento, use o quadro Testar para ver se a resposta certa é encontrada.',
      'Salve as mudanças.',
    ],
    tip: 'Comece com 5 a 10 perguntas que você responde todo dia. Já faz muita diferença.',
    link: { href: '/ia?tab=knowledge', label: 'Conhecimento da IA' },
    keywords: ['ia', 'inteligencia artificial', 'ensinar', 'treinar', 'conhecimento', 'catalogo', 'produtos', 'precos', 'perguntas', 'avancado', 'configuracoes avancadas'],
    routes: ['/ia'],
  },
  {
    id: 'retomar-conversa-parada',
    title: 'Retomar a conversa quando o cliente some',
    summary: 'Se o cliente parar de responder, a IA manda uma mensagem curta puxando o assunto de volta.',
    category: 'ai',
    steps: [
      'Abra Inteligência Artificial no menu.',
      'No Modo simples, ligue a chave do quadro Retomar conversa parada.',
      'Para escolher depois de quanto tempo a mensagem sai e mudar o texto, toque em Configurações avançadas e abra a aba Gatilhos.',
      'No quadro Retomar conversa parada, escolha o tempo em Mandar a mensagem depois de e escreva a Mensagem enviada. Em branco, o Synq usa o texto de exemplo.',
      'Salve as mudanças.',
    ],
    tip: 'Sai só uma mensagem por conversa parada, e nunca em conversa que já foi para uma pessoa da sua equipe. No Instagram e no WhatsApp Oficial, se o cliente não fala com você há mais de 24h, a mensagem não é enviada.',
    link: { href: '/ia', label: 'Inteligência Artificial' },
    keywords: ['retomar', 'retomada', 'cliente sumiu', 'parou de responder', 'conversa parada', 'follow up', 'followup', 'lembrete', 'silencio', 'reengajar'],
    routes: ['/ia', '/inbox'],
  },
  {
    id: 'recuperacao-vendas-plataformas',
    title: 'Recuperar vendas da Hotmart, Kiwify, Eduzz, Monetizze e PerfectPay',
    summary: 'Quando alguém desiste da compra, o Synq manda mensagens no WhatsApp ou no Instagram para trazer a pessoa de volta.',
    category: 'sales',
    steps: [
      'Abra Recuperação no menu e vá para a aba Integrações.',
      'Toque em Nova integração e, em Plataforma de vendas, escolha a sua: Hotmart, Kiwify, Eduzz, Monetizze ou PerfectPay.',
      'Ainda na aba Conexão, em Enviar as mensagens por, escolha WhatsApp, WhatsApp Oficial ou Instagram e o número ou a conta.',
      'Nas abas Carrinho abandonado e Pix ou boleto pendente, confira as mensagens e o tempo de espera de cada uma. Elas já vêm prontas.',
      'Toque em Criar e ver o passo a passo. Siga os passos numerados: copie o endereço, cole no painel da sua plataforma e toque em Começar o teste.',
      'Quando aparecer Recebemos! Sua integração está funcionando., toque em Concluir. Na aba Carrinhos você acompanha quem desistiu e quanto foi recuperado.',
    ],
    tip: 'A primeira mensagem funciona melhor pouco tempo depois da desistência, com o link para finalizar a compra.',
    link: { href: '/cart-recovery', label: 'Recuperação' },
    keywords: ['recuperacao', 'recuperar', 'carrinho', 'abandonado', 'checkout', 'hotmart', 'kiwify', 'eduzz', 'monetizze', 'perfectpay', 'perfect pay', 'venda', 'boleto', 'pix', 'integracao'],
    routes: ['/cart-recovery', '/dashboard'],
    featured: true,
    audiences: ['infoproduct', 'ecommerce'],
    available: !HIDDEN_FEATURES.cartRecovery,
  },
  {
    id: 'boas-vindas-comprador',
    title: 'Mandar boas-vindas para quem acabou de comprar',
    summary: 'Quando a compra é aprovada na sua plataforma de vendas, o comprador recebe uma mensagem sua com o acesso e as próximas etapas.',
    category: 'sales',
    steps: [
      'Ligue a sua plataforma de vendas em Recuperação, na aba Integrações (veja o artigo sobre recuperar vendas).',
      'Na lista de integrações, toque em Editar na plataforma e abra a aba Boas-vindas ao comprador.',
      'Ligue a opção Mandar boas-vindas quando a compra for aprovada.',
      'Escreva a mensagem de boas-vindas. Você pode usar o nome do comprador na mensagem.',
      'Escolha depois de quantos minutos ela sai e salve.',
    ],
    tip: 'No WhatsApp pelo QR Code a mensagem chega para o telefone informado na compra. No Instagram e no WhatsApp Oficial, ela só chega para quem conversou com você nas últimas 24h.',
    link: { href: '/cart-recovery', label: 'Recuperação' },
    keywords: ['boas-vindas', 'boas vindas', 'comprador', 'compra aprovada', 'pos-venda', 'pos venda', 'acesso', 'hotmart', 'kiwify', 'eduzz', 'monetizze', 'perfectpay', 'onboarding'],
    routes: ['/cart-recovery'],
    audiences: ['infoproduct', 'ecommerce'],
    available: !HIDDEN_FEATURES.cartRecovery,
  },
  {
    id: 'enviar-campanha',
    title: 'Enviar uma campanha para seus clientes',
    summary: 'Mande a mesma mensagem para muitos clientes de uma vez, na hora ou agendada.',
    category: 'sales',
    steps: [
      'Tenha um número no WhatsApp Oficial e um modelo de mensagem aprovado pela Meta.',
      'Abra Campanhas no menu e toque em Nova Campanha.',
      'Dê um nome para a campanha e escolha de onde vêm os destinatários.',
      'Escolha o modelo de mensagem aprovado e preencha os campos dele.',
      'Confira os destinatários e escolha se envia agora ou agenda para outro dia e horário.',
      'Confirme. Na lista de campanhas você acompanha quantas mensagens foram enviadas.',
    ],
    tip: 'Mande só para quem já é seu cliente ou pediu para receber. Isso protege o seu número.',
    link: { href: '/campaigns', label: 'Campanhas' },
    keywords: ['campanha', 'disparo', 'enviar para todos', 'mensagem em massa', 'lista', 'transmissao', 'promocao', 'agendar', 'modelo'],
    routes: ['/campaigns', '/templates', '/groups'],
    available: !LOCKED_FEATURES.campaigns,
  },
  {
    id: 'importar-contatos',
    title: 'Importar contatos de uma planilha',
    summary: 'Traga a sua lista de clientes para o Synq de uma vez, a partir de uma planilha do Excel ou do Google.',
    category: 'contacts',
    steps: [
      'Abra Contatos no menu e toque em Importar Planilha.',
      'Se precisar, toque em Baixar planilha modelo para ver como organizar as colunas.',
      'Preencha a planilha com o telefone de cada cliente, com DDD. O nome é opcional.',
      'Salve o arquivo em .xlsx ou .csv (até 6 MB) e escolha esse arquivo na janela.',
      'No fim, o Synq mostra quantos contatos entraram e quais linhas tiveram problema.',
    ],
    tip: 'Importe só quem já autorizou receber suas mensagens. Os contatos do Instagram entram sozinhos assim que a pessoa manda mensagem.',
    link: { href: '/contacts', label: 'Contatos' },
    keywords: ['importar', 'planilha', 'excel', 'csv', 'xlsx', 'lista', 'contatos', 'clientes', 'subir', 'google planilhas'],
    routes: ['/contacts', '/groups'],
  },
  {
    id: 'responder-conversas',
    title: 'Responder clientes em Conversas',
    summary: 'As mensagens do WhatsApp e do Instagram chegam num lugar só, para você ou sua equipe responder.',
    category: 'contacts',
    steps: [
      'Abra Conversas no menu.',
      'Na lista, toque na conversa que você quer abrir. Use a busca para achar um cliente.',
      'Escreva a resposta embaixo e envie.',
      'No painel do contato, em Atendimento, você escolhe quem da equipe cuida do cliente ou devolve a conversa para a fila comum.',
    ],
    tip: 'No Instagram e no WhatsApp Oficial, você responde livremente até 24h depois da última mensagem do cliente. Depois disso, no WhatsApp Oficial, para chamar de novo use um modelo aprovado.',
    link: { href: '/inbox', label: 'Conversas' },
    keywords: ['conversas', 'chat', 'caixa de entrada', 'responder', 'atender', 'mensagens', 'fila', 'atendimento', 'humano', 'inbox'],
    routes: ['/inbox', '/contacts'],
    audiences: ['local', 'ecommerce'],
  },
  {
    id: 'teste-gratis-planos',
    title: 'Teste grátis e planos',
    summary: 'Durante o teste você usa o Synq de verdade. Antes de acabar, escolha um plano para continuar com tudo funcionando.',
    category: 'account',
    steps: [
      'O aviso no topo das telas mostra quantos dias faltam para o teste acabar.',
      'Para ver os planos, toque em Escolher plano no aviso.',
      'Compare o que cada plano inclui, como quantidade de números, contatos e automações.',
      'Toque em Escolher Plano no plano que faz sentido para você e conclua o pagamento.',
      'Depois, em Configurações, na aba Faturamento, você vê o plano atual e pode trocar quando quiser.',
      'Se o teste acabar sem um plano, a IA e as automações ficam pausadas, mas nada é apagado. Ao assinar, tudo volta a funcionar do jeito que estava.',
    ],
    tip: 'Aproveite o teste para deixar pelo menos uma automação funcionando. É o jeito mais rápido de ver resultado.',
    link: { href: '/plans', label: 'Planos' },
    keywords: ['teste', 'teste gratis', 'gratis', 'trial', 'plano', 'planos', 'assinar', 'pagar', 'pagamento', 'preco', 'cobranca', 'faturamento', 'cancelar'],
    routes: ['/plans', '/settings', '/dashboard'],
  },
  {
    id: 'convidar-equipe',
    title: 'Convidar alguém da equipe',
    summary: 'Chame funcionários para atender clientes no Synq, cada um com o próprio acesso.',
    category: 'account',
    steps: [
      'Abra Configurações no menu e vá para a aba Membros.',
      'Toque em Convidar.',
      'Digite o e-mail da pessoa e marque o que ela pode acessar.',
      'Envie o convite. A pessoa recebe um e-mail para criar o acesso dela.',
      'Enquanto não for aceito, o convite fica em Convites pendentes, e você pode cancelar quando quiser.',
    ],
    tip: 'Cada convite ocupa uma vaga do seu plano até ser aceito ou cancelado.',
    link: { href: '/settings?tab=members', label: 'Membros' },
    keywords: ['equipe', 'time', 'funcionario', 'colaborador', 'membro', 'convidar', 'convite', 'acesso', 'permissao', 'atendente'],
    routes: ['/settings', '/inbox'],
  },
];

export const HELP_ARTICLES: HelpArticle[] = ALL_HELP_ARTICLES.filter((article) => article.available !== false);

export function normalizeHelpText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripQuery(href: string): string {
  return href.split('?')[0] ?? href;
}

function matchesRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

interface IndexedArticle {
  article: HelpArticle;
  title: string;
  keywords: string;
  summary: string;
  body: string;
}

function indexArticle(article: HelpArticle): IndexedArticle {
  return {
    article,
    title: normalizeHelpText(article.title),
    keywords: normalizeHelpText(article.keywords.join(' ')),
    summary: normalizeHelpText(article.summary),
    body: normalizeHelpText([...article.steps, article.tip ?? '', article.link.label].join(' ')),
  };
}

function scoreTerm(entry: IndexedArticle, term: string): number {
  if (entry.title.includes(term)) return 4;
  if (entry.keywords.includes(term)) return 3;
  if (entry.summary.includes(term)) return 2;
  if (entry.body.includes(term)) return 1;
  return 0;
}

export function searchHelpArticles(articles: HelpArticle[], query: string): HelpArticle[] {
  const normalized = normalizeHelpText(query);
  if (!normalized) return [];
  const terms = normalized.split(' ').filter((term) => term.length > 1);
  if (terms.length === 0) return [];
  return articles
    .map(indexArticle)
    .map((entry) => {
      const scores = terms.map((term) => scoreTerm(entry, term));
      const matched = scores.filter((score) => score > 0).length;
      const phraseBonus = entry.title.includes(normalized) || entry.keywords.includes(normalized) ? 5 : 0;
      return { article: entry.article, matched, score: scores.reduce((sum, score) => sum + score, 0) + phraseBonus };
    })
    .filter((result) => result.matched >= Math.max(1, Math.ceil(terms.length * 0.6)))
    .sort((a, b) => b.score - a.score)
    .map((result) => result.article);
}

export function suggestHelpArticles(
  articles: HelpArticle[],
  pathname: string,
  businessType: BusinessType | null,
  limit = 3,
): HelpArticle[] {
  const fitsAudience = (article: HelpArticle) => !businessType || !article.audiences || article.audiences.includes(businessType);
  const routeMatches = articles
    .filter((article) => article.routes.some((route) => matchesRoute(pathname, route)))
    .sort((a, b) => Number(fitsAudience(b)) - Number(fitsAudience(a)));
  const picked = routeMatches.slice(0, limit);
  if (picked.length >= limit) return picked;
  const fillers = articles.filter((article) => article.featured && fitsAudience(article) && !picked.includes(article));
  return [...picked, ...fillers].slice(0, limit);
}

export function findHelpArticle(articles: HelpArticle[], id: string): HelpArticle | null {
  return articles.find((article) => article.id === id) ?? null;
}
