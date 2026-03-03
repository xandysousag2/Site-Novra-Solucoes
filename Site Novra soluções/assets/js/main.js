
(() => {
  const WHATSAPP_NUMBER = "5541987377444";

  // ---------- Helpers ----------
  const qs = (sel, el = document) => el.querySelector(sel);
  const qsa = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  function sanitizeMoneyToNumber(value) {
    if (!value) return NaN;
    // Accept "1.250,50" or "1250.50" or "1250"
    const v = String(value)
      .trim()
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^\d.]/g, "");
    return Number(v);
  }

  function formatBRL(n) {
    try {
      return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    } catch {
      return `R$ ${n.toFixed(2)}`;
    }
  }

  function buildWaLink(message) {
    const text = encodeURIComponent(message);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
  }

  function openWhatsApp(message) {
    window.open(buildWaLink(message), "_blank", "noopener,noreferrer");
  }

  // ---------- Theme toggle (preview) ----------
  qsa("[data-theme-toggle]").forEach(btn => {
    btn.addEventListener("click", () => {
      const t = btn.getAttribute("data-theme-toggle");
      document.documentElement.setAttribute("data-theme", t);
      try { localStorage.setItem("novra_theme", t); } catch {}
    });
  });

  try {
    const saved = localStorage.getItem("novra_theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
  } catch {}

  // ---------- WhatsApp generic buttons ----------
  qsa("[data-whatsapp='true']").forEach(el => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const source = el.getAttribute("data-whatsapp-source") || "site";
      const msg =
`Olá! Vim pelo site da Novra e quero falar com um especialista sobre Energia por Assinatura.
Origem: ${source}

Quero simular com 20% de desconto no kWh.
Atendimento PR/SC/MS (Copel/Celesc/Energisa).

Vou enviar minha conta de luz (PDF/foto) na sequência.`;
      openWhatsApp(msg);
    });
  });

  // ---------- Modal ----------
  const modal = qs("#modal-simulador");
  const openButtons = qsa("[data-open-modal='simulador']");
  const closeButtons = qsa("[data-close-modal='simulador']");

  let lastActiveEl = null;

  function setAriaHidden(hidden) {
    modal.setAttribute("aria-hidden", hidden ? "true" : "false");
  }

  function openModal() {
    lastActiveEl = document.activeElement;
    setAriaHidden(false);

    // Focus first interactive element
    const first = qs("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])", modal);
    if (first) first.focus();

    document.addEventListener("keydown", onKeyDown);
  }

  function closeModal() {
    setAriaHidden(true);
    document.removeEventListener("keydown", onKeyDown);
    if (lastActiveEl && typeof lastActiveEl.focus === "function") lastActiveEl.focus();
  }

  function onKeyDown(e) {
    if (e.key === "Escape") {
      closeModal();
      return;
    }
    // Simple focus trap
    if (e.key === "Tab" && modal.getAttribute("aria-hidden") === "false") {
      const focusables = qsa("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])", modal)
        .filter(el => !el.disabled && el.offsetParent !== null);
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  openButtons.forEach(btn => btn.addEventListener("click", (e) => {
    e.preventDefault();
    openModal();
  }));
  closeButtons.forEach(btn => btn.addEventListener("click", (e) => {
    e.preventDefault();
    closeModal();
  }));

  // ---------- Tabs ----------
  const tabs = qsa(".tab", modal);
  const panels = qsa("[data-tab-panel]", modal);

  function activateTab(name) {
    tabs.forEach(t => {
      const is = t.getAttribute("data-tab") === name;
      t.classList.toggle("is-active", is);
      t.setAttribute("aria-selected", is ? "true" : "false");
    });
    panels.forEach(p => p.classList.toggle("is-active", p.getAttribute("data-tab-panel") === name));
  }

  tabs.forEach(t => t.addEventListener("click", () => activateTab(t.getAttribute("data-tab"))));

  qsa("[data-switch-tab]", modal).forEach(btn => {
    btn.addEventListener("click", () => activateTab(btn.getAttribute("data-switch-tab")));
  });

  // ---------- Form: Enviar fatura -> WhatsApp ----------
  const formFatura = qs("#form-fatura");
  formFatura.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(formFatura);

    const tipo = fd.get("tipo") || "";
    const estado = fd.get("estado") || "";
    const distribuidora = fd.get("distribuidora") || "";
    const grupo = fd.get("grupo") || "";
    const ucs = fd.get("ucs") || "";
    const valorMensal = fd.get("valorMensal") || "";
    const nome = fd.get("nome") || "";
    const email = fd.get("email") || "";
    const whats = fd.get("whats") || "";

    const msg =
`Olá! Quero uma proposta de Energia por Assinatura (Novra).

Dados:
- Nome: ${nome}
- Tipo: ${tipo}
- Estado: ${estado}
- Distribuidora: ${distribuidora}
- Grupo: ${grupo}
- Nº de UCs: ${ucs || "não informado"}
- Fatura média (R$/mês): ${valorMensal || "não informado"}
- Contato: ${whats || "não informado"} | ${email}

Observações:
- Entendo que são 2 faturas (distribuidora + energia por assinatura).
- O desconto é 20% no kWh.
- Vou anexar agora a conta de luz (PDF/foto) nesta conversa.`;

    openWhatsApp(msg);
  });

  // ---------- Form: Simulação rápida -> mostra faixa em R$ ----------
  const formRapido = qs("#form-rapido");
  const resultBox = qs("#resultado-rapido");

  formRapido.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(formRapido);

    const estado = fd.get("estado") || "";
    const distribuidora = fd.get("distribuidora") || "";
    const grupo = fd.get("grupo") || "";
    const ucs = fd.get("ucs") || "";
    const valorMensalRaw = fd.get("valorMensal") || "";

    const valorMensal = sanitizeMoneyToNumber(valorMensalRaw);

    if (!Number.isFinite(valorMensal) || valorMensal <= 0) {
      resultBox.hidden = false;
      resultBox.innerHTML = `<strong>Confira o valor da fatura média.</strong> Use apenas números (ex.: 1250).`;
      return;
    }

    const minPct = 0.12;
    const maxPct = 0.18;

    const minMes = valorMensal * minPct;
    const maxMes = valorMensal * maxPct;

    const minAno = minMes * 12;
    const maxAno = maxMes * 12;

    resultBox.hidden = false;
    resultBox.innerHTML = `
      <div style="display:grid; gap:8px;">
        <div><strong>Prévia calculada</strong> (estimativa preliminar)</div>
        <div class="muted">Base: ${estado} • ${distribuidora} • Grupo ${grupo} • UCs: ${ucs || "n/d"}</div>
        <div><strong>Economia estimada:</strong> ${formatBRL(minMes)} a ${formatBRL(maxMes)} / mês</div>
        <div><strong>No ano:</strong> ${formatBRL(minAno)} a ${formatBRL(maxAno)} / ano</div>
        <div class="muted">Desconto fixo: <strong>20% no kWh</strong>. Economia líquida varia por impostos/iluminação pública. Com bandeira tarifária, na prática, a economia aumenta.</div>
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:6px;">
          <button class="btn btn-primary" type="button" id="btn-ir-fatura">Quero a proposta precisa (enviar fatura)</button>
          <a class="btn btn-ghost" href="#" id="btn-whats-rapido">Falar no WhatsApp</a>
        </div>
      </div>
    `;

    const btnIrFatura = qs("#btn-ir-fatura", resultBox);
    const btnWhatsRapido = qs("#btn-whats-rapido", resultBox);

    btnIrFatura.addEventListener("click", () => activateTab("enviar-fatura"));

    btnWhatsRapido.addEventListener("click", (ev) => {
      ev.preventDefault();
      const msg =
`Olá! Fiz uma simulação rápida no site da Novra e quero uma proposta precisa.

Dados:
- Estado: ${estado}
- Distribuidora: ${distribuidora}
- Grupo: ${grupo}
- Nº de UCs: ${ucs || "não informado"}
- Fatura média: ${valorMensalRaw}

Vou enviar a conta de luz (PDF/foto) na sequência para refinar a proposta.`;
      openWhatsApp(msg);
    });
  });
})();
