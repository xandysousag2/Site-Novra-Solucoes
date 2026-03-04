// FAQ – Energia por Assinatura e Eficiência Energética
(function () {
  "use strict";

  document.querySelectorAll(".faq-question").forEach(function (btn) {
    btn.setAttribute("aria-expanded", "false");

    btn.addEventListener("click", function () {
      const answer = this.nextElementSibling;
      const expanded = this.getAttribute("aria-expanded") === "true";

      // Fecha todos
      document.querySelectorAll(".faq-question").forEach(function (other) {
        other.setAttribute("aria-expanded", "false");
        const otherAnswer = other.nextElementSibling;
        if (otherAnswer) otherAnswer.hidden = true;
      });

      // Abre o clicado (se estava fechado)
      if (!expanded) {
        this.setAttribute("aria-expanded", "true");
        if (answer) answer.hidden = false;
      }
    });
  });
})();
