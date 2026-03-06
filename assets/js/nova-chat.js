/* ==========================================
   NOVA — Assistente Virtual Novra
   Arquivo: assets/js/nova-chat.js

   ESTRUTURA:
   1. Configuração por página (NOVRA_CONFIG)
   2. Referências ao DOM
   3. Inicialização
   4. Abrir e fechar
   5. Fluxo de mensagens
   6. Motor de respostas simuladas
   7. Utilitários
   8. Ponte para N8N (comentada — ativar no sábado)
========================================== */

(function () {
  'use strict';

  /* ==========================================
     1. CONFIGURAÇÃO POR PÁGINA
  ========================================== */

  var NOVRA_CONFIG = {

    home: {
      welcome: 'Olá! Sou a <strong>Nova</strong>, assistente virtual da Novra.<br><br>Posso te ajudar a entender nossas soluções de energia e escolher a que faz mais sentido para o seu negócio.<br><br>Por onde quer começar?',
      questions: [
        { label: 'Energia por Assinatura',  value: 'Como funciona a energia por assinatura?' },
        { label: 'Eficiência Energética',   value: 'O que é eficiência energética pelo PEE?' },
        { label: 'Soluções Industriais',    value: 'Quais são as soluções industriais da Novra?' },
        { label: 'Falar com especialista',  value: 'Quero falar com um especialista.' }
      ]
    },

    assinatura: {
      welcome: 'Olá! Sou a <strong>Nova</strong>, assistente da Novra.<br><br>Vejo que você está conhecendo a Energia por Assinatura. Posso te explicar como funciona, quanto sua empresa pode economizar e como é a relação com a sua distribuidora atual.<br><br>O que você quer entender primeiro?',
      questions: [
        { label: 'Como funciona?',                value: 'Como funciona a energia por assinatura?' },
        { label: 'A Copel continua sendo minha?', value: 'A distribuidora continua sendo a mesma?' },
        { label: 'Quanto vou economizar?',        value: 'Quanto eu realmente economizo na fatura?' },
        { label: 'Posso cancelar quando quiser?', value: 'Como funciona o cancelamento do contrato?' }
      ]
    },

    eficiencia: {
      welcome: 'Olá! Sou a <strong>Nova</strong>, assistente da Novra.<br><br>Aqui você pode entender como usar recursos das distribuidoras para modernizar a infraestrutura da sua empresa — sem impacto no caixa.<br><br>Quer entender se a sua empresa se enquadra ou como funciona o financiamento?',
      questions: [
        { label: 'O que é o PEE?',             value: 'O que é o PEE da ANEEL?' },
        { label: 'Minha empresa se enquadra?', value: 'Como saber se minha empresa se enquadra no PEE?' },
        { label: 'Como é o financiamento?',    value: 'Como funciona o financiamento do projeto?' },
        { label: 'Quanto tempo leva?',         value: 'Quanto tempo leva um projeto de eficiência energética?' }
      ]
    },

    industrial: {
      welcome: 'Olá! Sou a <strong>Nova</strong>, assistente da Novra.<br><br>A Novra oferece soluções técnicas completas para indústrias — desde sistemas elétricos até aspiração central e tubulações industriais.<br><br>Me conta o que você precisa e te direciono para o especialista certo.',
      questions: [
        { label: 'Painéis e quadros elétricos',   value: 'Vocês fornecem painéis e quadros elétricos?' },
        { label: 'Sistemas de medição',            value: 'Como funcionam os sistemas de medição e telemetria?' },
        { label: 'Tubos e irrigação',              value: 'Vocês trabalham com tubos para irrigação e saneamento?' },
        { label: 'Falar com especialista técnico', value: 'Quero falar com um especialista em soluções industriais.' }
      ]
    }

  };

  var page    = (typeof NOVRA_PAGE !== 'undefined') ? NOVRA_PAGE : 'home';
  var context = NOVRA_CONFIG[page] || NOVRA_CONFIG['home'];


  /* ==========================================
     2. REFERÊNCIAS AO DOM
  ========================================== */

  var widget     = document.getElementById('novra-chat-widget');
  var toggleBtn  = document.getElementById('novra-chat-toggle');
  var closeBtn   = document.getElementById('novra-chat-close');
  var balloon    = document.getElementById('novra-chat-balloon');
  var balloonX   = document.getElementById('novra-balloon-close');
  var messagesEl = document.getElementById('novra-chat-messages');
  var quickEl    = document.getElementById('novra-quick-questions');
  var inputEl    = document.getElementById('novra-chat-input');
  var sendBtn    = document.getElementById('novra-chat-send');

  var exchangeCount = 0;


  /* ==========================================
     3. INICIALIZAÇÃO
  ========================================== */

  function init() {

    appendMessage(context.welcome, 'bot');

    context.questions.forEach(function (q) {
      var btn = document.createElement('button');
      btn.textContent = q.label;
      btn.setAttribute('data-question', q.value);
      btn.addEventListener('click', function () {
        handleUserMessage(q.value);
        hideQuickQuestions();
      });
      quickEl.appendChild(btn);
    });

    setTimeout(function () {
      if (widget.classList.contains('novra-chat-closed') && balloon) {
        balloon.removeAttribute('hidden');
      }
    }, 6000);

    toggleBtn.addEventListener('click', openChat);
    closeBtn.addEventListener('click', closeChat);

    if (balloonX) {
      balloonX.addEventListener('click', function () {
        balloon.setAttribute('hidden', '');
      });
    }

    sendBtn.addEventListener('click', function () {
      var text = inputEl.value.trim();
      if (text) handleUserMessage(text);
    });

    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var text = inputEl.value.trim();
        if (text) handleUserMessage(text);
      }
    });

    /* Habilita/desabilita botão de envio conforme input */
    inputEl.addEventListener('input', function () {
      var hasText = inputEl.value.trim().length > 0;
      sendBtn.disabled = !hasText;
      sendBtn.style.opacity = hasText ? '1' : '0.45';
      sendBtn.style.cursor  = hasText ? 'pointer' : 'not-allowed';
    });

    /* Estado inicial: desabilitado */
    sendBtn.disabled = true;
    sendBtn.style.opacity = '0.45';
    sendBtn.style.cursor  = 'not-allowed';
  }


  /* ==========================================
     4. ABRIR E FECHAR
  ========================================== */

  function openChat() {
    widget.classList.remove('novra-chat-closed');
    if (balloon) balloon.setAttribute('hidden', '');
    inputEl.focus();
  }

  function closeChat() {
    widget.classList.add('novra-chat-closed');
  }


  /* ==========================================
     5. FLUXO DE MENSAGENS
  ========================================== */

  function handleUserMessage(text) {
    appendMessage(text, 'user');
    inputEl.value = '';
    hideQuickQuestions();
    exchangeCount++;

    /* Desabilita envio enquanto aguarda resposta */
    setInputLocked(true);
    showTyping();

    var delay = 1200 + Math.random() * 800;

    setTimeout(function () {
      removeTyping();
      var reply = simulateReply(text);
      appendMessage(reply, 'bot');
      setInputLocked(false);
      inputEl.focus();

      if (exchangeCount >= 3) {
        setTimeout(offerWhatsApp, 800);
      }

    }, delay);
  }

  /* Bloqueia ou libera o campo de envio */
  function setInputLocked(locked) {
    inputEl.disabled  = locked;
    sendBtn.disabled  = locked;
    sendBtn.style.opacity = locked ? '0.45' : '0.45'; /* mantém desabilitado até digitar */
    sendBtn.style.cursor  = locked ? 'not-allowed' : 'not-allowed';
    inputEl.style.opacity = locked ? '0.6' : '1';
    inputEl.style.cursor  = locked ? 'not-allowed' : 'text';
  }


  /* ==========================================
     6. MOTOR DE RESPOSTAS SIMULADAS
  ========================================== */

  function simulateReply(input) {
    var msg = input.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    /* Respostas prioritárias por página (contexto) */
    if (page === 'assinatura') {
      if (contains(msg, ['cancelar', 'sair', 'contrato', 'fidelidade', 'prazo', 'multa', 'rescisao'])) {
        return 'Na Energia por Assinatura, o cancelamento é feito com aviso prévio, <strong>sem multas abusivas</strong>. O prazo exato é definido em contrato antes da adesão.<br><br>Você não fica preso a compromissos longos — essa flexibilidade é uma das principais vantagens do modelo.';
      }
    }

    if (page === 'eficiencia') {
      if (contains(msg, ['enquadra', 'elegivel', 'posso participar', 'minha empresa', 'se encaixa', 'quem pode'])) {
        return 'Qualquer empresa com potencial técnico de redução de consumo pode participar do PEE — não há restrição de setor ou porte.<br><br>A elegibilidade é definida no diagnóstico preliminar, que a Novra realiza <strong>sem custo e sem compromisso</strong>.<br><br>Quer agendar essa análise agora?';
      }
      if (contains(msg, ['financiamento', 'financiado', 'custo zero', 'fundo perdido', 'pago pela economia'])) {
        return 'Os projetos via PEE têm dois modelos:<br><br><ul><li><strong>Fundo perdido:</strong> para entidades filantrópicas com CEBAS e órgãos públicos. Custo zero.</li><li><strong>Pago pela economia gerada:</strong> o retorno financeiro do projeto cobre o investimento. Sem impacto no caixa.</li></ul>Em ambos, o diagnóstico preliminar é gratuito.';
      }
    }

    if (page === 'industrial') {
      if (contains(msg, ['painel', 'quadro eletrico', 'paineis'])) {
        return 'Sim! A Novra fornece <strong>painéis e quadros elétricos</strong> para diferentes aplicações industriais — desde painéis de distribuição até quadros de comando e automação.<br><br>Trabalhamos com grandes fabricantes e podemos especificar a solução ideal para o seu ambiente. Quer detalhar sua necessidade?';
      }
      if (contains(msg, ['medicao', 'telemetria', 'medicao', 'medidor'])) {
        return 'Nossos <strong>sistemas de medição e telemetria</strong> permitem monitorar consumo de energia, água e gás em tempo real, com leitura remota e geração de relatórios.<br><br>São ideais para indústrias que precisam de controle preciso e rastreabilidade do consumo. Quer conversar com um especialista técnico?';
      }
    }

    /* Respostas gerais — funcionam em qualquer página */

    if (contains(msg, ['assinatura', 'como funciona', 'energia por', 'credito', 'usina', 'fazenda solar'])) {
      return 'A Energia por Assinatura funciona assim: você continua recebendo energia normalmente pela sua distribuidora, mas parte do seu consumo passa a ser compensado por créditos de uma usina parceira — com desconto garantido na tarifa.<br><br>Sem obras, sem equipamentos, sem fidelidade abusiva. Você só passa a pagar menos pelo mesmo consumo.';
    }

    if (contains(msg, ['copel', 'celesc', 'energisa', 'distribuidora', 'concessionaria', 'fornecedora', 'mesma', 'continua'])) {
      return 'Sim, sua distribuidora continua sendo a mesma. A Copel, Celesc ou Energisa seguem responsáveis por entregar a energia com a mesma qualidade e atendimento de sempre.<br><br>O que muda é que uma usina parceira passa a injetar créditos na sua conta — com desconto já aplicado na tarifa.';
    }

    if (contains(msg, ['econom', 'desconto', 'quanto', 'reducao', 'valor', 'fatura', 'conta', 'kw', 'kwh'])) {
      return 'O desconto contratado é de <strong>20% sobre a tarifa de energia da distribuidora (sem impostos)</strong>. Na fatura final, a economia líquida costuma ficar entre <strong>12% e 18%</strong>, dependendo do perfil de consumo.<br><br>Para uma simulação com os dados da sua empresa, o ideal é falar com um especialista — leva menos de 5 minutos.';
    }

    if (contains(msg, ['cancelar', 'sair', 'contrato', 'fidelidade', 'prazo', 'multa', 'rescisao'])) {
      return 'O contrato permite cancelamento com aviso prévio, <strong>sem multas abusivas</strong>. O prazo e as condições são definidos antes da adesão.<br><br>Essa flexibilidade é uma das vantagens do modelo.';
    }

    if (contains(msg, ['pee', 'aneel', 'eficiencia', 'modernizar', 'iluminacao', 'led', 'motor', 'climatizacao', 'hvac'])) {
      return 'Pelo <strong>PEE da ANEEL</strong>, as distribuidoras investem em projetos que reduzem o consumo das empresas. A Novra estrutura e conduz todo o processo.<br><br>Os modelos são custo zero (fundo perdido para entidades elegíveis) ou pago pela própria economia gerada — sem impacto no caixa em ambos os casos.';
    }

    if (contains(msg, ['enquadra', 'elegivel', 'posso participar', 'minha empresa', 'quem pode'])) {
      return 'Qualquer empresa com potencial de redução de consumo pode participar. A elegibilidade é definida no diagnóstico preliminar, que a Novra realiza <strong>sem custo e sem compromisso</strong>.<br><br>Quer que eu te conecte com um especialista para essa análise?';
    }

    if (contains(msg, ['prazo', 'tempo', 'quanto tempo', 'demora', 'cronograma', 'quando'])) {
      return 'O prazo varia conforme a complexidade do projeto. Em média, projetos de menor escala levam de <strong>6 a 12 meses</strong> do diagnóstico à entrega.<br><br>Todo o cronograma físico-financeiro é definido em contrato antes do início das obras.';
    }

    if (contains(msg, ['industrial', 'industria', 'painel', 'quadro eletrico', 'medicao', 'telemetria', 'tubo', 'irrigacao', 'aspiracao', 'transformador', 'protecao', 'surto'])) {
      return 'A Novra trabalha com <strong>soluções técnicas para indústrias</strong> em todo o Brasil:<br><br><ul><li>Painéis e quadros elétricos</li><li>Sistemas de medição e telemetria</li><li>Tubos e conexões para irrigação e saneamento</li><li>Aspiração central</li><li>Proteção contra surtos e transformadores</li></ul>Quer detalhar sua necessidade?';
    }

    if (contains(msg, ['novra', 'quem', 'sobre', 'empresa', 'historia', 'experiencia', 'anos', 'confiavel'])) {
      return 'A <strong>Novra Soluções</strong> atua com energia e soluções técnicas industriais em todo o Brasil.<br><br>Reunimos mais de 15 anos de experiência em energia e engenharia, com parcerias estratégicas com grandes fabricantes nacionais.<br><br>Atuamos em Energia por Assinatura (PR, SC e MS), Eficiência Energética via PEE e Soluções Industriais.';
    }

    if (contains(msg, ['solucoes', 'o que voces fazem', 'servicos', 'areas', 'segmentos'])) {
      return 'A Novra atua em três frentes:<br><br><ul><li><strong>Energia por Assinatura:</strong> redução de 12–18% na conta, sem obras</li><li><strong>Eficiência Energética via PEE:</strong> modernização financiada pela distribuidora</li><li><strong>Soluções Industriais:</strong> painéis, medição, tubulações e mais</li></ul>Quer que eu explique alguma delas com mais detalhe?';
    }

    if (contains(msg, ['onde', 'regiao', 'estado', 'cidade', 'atende', 'parana', 'santa catarina', 'mato grosso', 'brasil', 'nacional'])) {
      return 'A Novra atende em todo o Brasil para Eficiência Energética e Soluções Industriais.<br><br>Para <strong>Energia por Assinatura</strong>, a atuação atual está nos estados do <strong>Paraná, Santa Catarina e Mato Grosso do Sul</strong>, dentro das áreas de concessão da Copel, Celesc e Energisa.';
    }

    if (contains(msg, ['simular', 'simulacao', 'calculo', 'calcular', 'estimar'])) {
      return 'Para simular com precisão, precisamos de alguns dados:<br><br><ul><li>Valor médio da conta de energia (R$)</li><li>Consumo médio em kWh</li><li>Sua distribuidora (Copel, Celesc ou Energisa)</li></ul>O ideal é fazer essa análise com um especialista pelo WhatsApp — leva menos de 5 minutos e já sai com o número real de economia.';
    }

    if (contains(msg, ['especialista', 'humano', 'pessoa', 'falar', 'whatsapp', 'zap', 'ligar', 'contato', 'atendimento'])) {
      return 'Claro! Nosso time está disponível agora mesmo.<br><br>Clique em <strong>"Abrir WhatsApp"</strong> aqui embaixo e um especialista te atende em poucos minutos.';
    }

    /* Fallback */
    return 'Entendi sua dúvida. Para garantir uma resposta precisa sobre esse ponto, o melhor caminho é conversar diretamente com um especialista da Novra.<br><br>Clique em <strong>"Abrir WhatsApp"</strong> aqui embaixo — a conversa leva menos de 1 minuto.';
  }


  /* ==========================================
     7. UTILITÁRIOS
  ========================================== */

  function contains(text, keywords) {
    return keywords.some(function (kw) {
      return text.indexOf(kw) !== -1;
    });
  }

  function appendMessage(html, type) {
    var wrapper = document.createElement('div');
    wrapper.className = 'novra-msg novra-msg-' + type;

    var bubble = document.createElement('div');
    bubble.className = 'novra-bubble';
    bubble.innerHTML = html;

    wrapper.appendChild(bubble);
    messagesEl.appendChild(wrapper);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    var typing = document.createElement('div');
    typing.className = 'novra-msg novra-msg-bot novra-typing';
    typing.id = 'novra-typing-indicator';
    typing.innerHTML = '<div class="novra-bubble">Nova está digitando...</div>';
    messagesEl.appendChild(typing);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function removeTyping() {
    var el = document.getElementById('novra-typing-indicator');
    if (el) el.remove();
  }

  function hideQuickQuestions() {
    if (quickEl) quickEl.style.display = 'none';
  }

  function offerWhatsApp() {
    if (document.getElementById('novra-wpp-offer')) return;

    var offer = document.createElement('div');
    offer.id = 'novra-wpp-offer';
    offer.className = 'novra-msg novra-msg-bot';
    offer.innerHTML = '<div class="novra-bubble">Se quiser uma análise detalhada para a sua empresa, um especialista pode te atender agora mesmo.<br><br><a href="https://wa.me/5541987377444?text=Ol%C3%A1%2C%20vim%20pelo%20site%20da%20Novra%20e%20gostaria%20de%20conversar%20com%20um%20especialista." target="_blank" rel="noopener" style="display:inline-block;margin-top:8px;padding:10px 20px;background:var(--accent);color:white;border-radius:8px;font-weight:700;font-size:0.85rem;text-decoration:none;">Falar com especialista agora</a></div>';

    messagesEl.appendChild(offer);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }


  /* ==========================================
     8. PONTE PARA N8N
     Descomente e ative quando a infra
     estiver pronta.

     Passos para ativar:
     1. Descomente callN8N() abaixo
     2. Substitua 'SEU_WEBHOOK_N8N_AQUI' pela
        URL real do webhook
     3. Em handleUserMessage(), substitua:
           var reply = simulateReply(text);
        por:
           var reply = await callN8N(text);
        e adicione async na função pai.
  ========================================== */

  /*
  async function callN8N(text) {
    try {
      var response = await fetch('SEU_WEBHOOK_N8N_AQUI', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, page: page })
      });
      var data = await response.json();
      return data.reply || 'Não consegui processar sua pergunta agora. Tente pelo WhatsApp.';
    } catch (err) {
      return 'Tive um problema

