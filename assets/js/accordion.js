// =========================================
// ACCORDION: VER APLICAÇÕES TÍPICAS
// Controla a abertura e fechamento de cada
// bloco de aplicações nos cards industriais
// =========================================

document.addEventListener("DOMContentLoaded", function () {

  // Seleciona todos os botões de accordion da página
  var botoes = document.querySelectorAll(".accordion-toggle");

  // Para cada botão, adiciona o comportamento de clique
  botoes.forEach(function (botao) {
    botao.addEventListener("click", function () {

      // O conteúdo que queremos mostrar/esconder
      // é sempre o elemento HTML logo após o botão
      var conteudo = botao.nextElementSibling;

      // Verifica se está aberto ou fechado
      var estaAberto = botao.getAttribute("aria-expanded") === "true";

      if (estaAberto) {
        // Fecha: esconde o conteúdo e atualiza o estado
        conteudo.hidden = true;
        botao.setAttribute("aria-expanded", "false");
      } else {
        // Abre: mostra o conteúdo e atualiza o estado
        conteudo.hidden = false;
        botao.setAttribute("aria-expanded", "true");
      }

    });
  });

});
