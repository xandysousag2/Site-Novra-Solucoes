document.addEventListener('DOMContentLoaded', () => {
    // Lógica do Carrossel
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.indicator');
    let currentSlide = 0;

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        indicators.forEach(ind => ind.classList.remove('active'));
        slides[index].classList.add('active');
        indicators[index].classList.add('active');
    }

    setInterval(() => {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }, 5000);

    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            currentSlide = index;
            showSlide(currentSlide);
        });
    });

    // Lógica dos botões "Saiba Mais" (Abrir detalhes do card)
    const saibaMaisBtns = document.querySelectorAll('button.btn-saiba-mais');
    saibaMaisBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const details = btn.nextElementSibling;
            if(details && details.classList.contains('card-details')) {
                details.classList.toggle('active');
                btn.textContent = details.classList.contains('active') ? 'Ocultar Resumo' : 'Ver Resumo';
            }
        });
    });

    // Lógica do Chat Widget
    const chatBtn = document.getElementById('chatButton');
    const chatWidget = document.getElementById('chatWidget');
    const chatClose = document.getElementById('chatClose');

    if(chatBtn && chatWidget && chatClose) {
        chatBtn.addEventListener('click', () => chatWidget.classList.add('active'));
        chatClose.addEventListener('click', () => chatWidget.classList.remove('active'));
    }
});