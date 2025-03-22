/* Abre e fecha o menu quando clicar no icone: hamburguer e x */
const nav = document.querySelector("#header nav");
const toggle = document.querySelectorAll("nav .toggle");

for (const element of toggle) {
  element.addEventListener("click", () => {
    nav.classList.toggle("show");
  });
}

/* quando clicar em um item do menu, esconder o menu */
const links = document.querySelectorAll("nav ul li a");

for (const link of links) {
  link.addEventListener("click", () => {
    nav.classList.remove("show");
  });
}

/* mudar o header da página quando der scroll */
const header = document.querySelector("#header");
const navHeight = header.offsetHeight;
function changeHeaderWhenScroll() {
  if (window.scrollY >= navHeight) {
    header.classList.add("scroll");
    // scroll é maior que a altura do header
  } else {
    // menor que a altura do header
    header.classList.remove("scroll");
  }
}

/* ScrollReveal: Mostrar elementos quando der scroll na página */
const scrollReveal = ScrollReveal({
  origin: "top",
  distance: "30px",
  duration: 700,
  reset: true,
});

scrollReveal.reveal(
  `#home .main-image, #home .text,
#about .main-image, #about .text,
#services .header, #services .card,
#testimonials .header, #testimonials .testimonials,
#contact .text, #contact .links,
.footer .brand, .footer .social
`,
  { interval: 100 }
);

/* Botão voltar para o topo */
const backToTopButton = document.querySelector(".main-backToTop");
function backToTop() {
  if (window.scrollY >= 560) {
    backToTopButton.classList.add("show");
  } else {
    backToTopButton.classList.remove("show");
  }
}

/* Menu ativo conforme a seção visivel na página */
const sections = document.querySelectorAll("main section[id]");
function activateMenuAtCurrentSection() {
  const centralizedImaginaryLine = window.pageYOffset + window.innerHeight / 2;

  for (const section of sections) {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const sectionId = section.getAttribute("id");

    const lineCameInSection = centralizedImaginaryLine >= sectionTop;
    const lineIsInsideTheSection =
      centralizedImaginaryLine <= sectionTop + sectionHeight;

    if (lineCameInSection && lineIsInsideTheSection) {
      document
        .querySelector("nav ul li a[href*=" + sectionId + "]")
        .classList.add("active");
    } else {
      document
        .querySelector("nav ul li a[href*=" + sectionId + "]")
        .classList.remove("active");
    }
  }
}

/* When Scroll */
window.addEventListener("scroll", () => {
  changeHeaderWhenScroll();
  backToTop();
  activateMenuAtCurrentSection();
});

/* Redirecionar para Contact ao clicar num Card Service */
document.getElementById('card-restoration').addEventListener('click', function() {
  window.location.href = '#contact'; // Redireciona para a seção de contato
});
document.getElementById('card-cleaning').addEventListener('click', function() {
  window.location.href = '#contact'; // Redireciona para a seção de contato
});
document.getElementById('card-budget').addEventListener('click', function() {
  window.location.href = '#contact'; // Redireciona para a seção de contato
});

// Adiciona os cards e inicializa o Swiper
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("/api/jewelry");
    const jewelryList = await response.json();

    if (jewelryList.length === 0) {
      return;
    }
    
    const section = document.querySelector(".main-section.main-jewelry");
    if (section) {
      section.classList.remove("no-jewelry");
    }


    const swiperWrapper = document.querySelector(".jewelry-swiper .swiper-wrapper");
    if (!swiperWrapper) return;

    // Adiciona os slides dinamicamente
    jewelryList.forEach((jewel) => {
      const jewelCard = document.createElement("div");
      jewelCard.classList.add("jewel", "swiper-slide");

      jewelCard.innerHTML = `
        <div class="carousel-item">
          <img src="/assets/jewelry/${jewel.image}" alt="joia">
          <div class="jewel-description">
            <p>${jewel.description}</p>
          </div>
          <div class="client-info" style="display: none;">
            <div>
              <img src="./assets/images/image1" alt="Foto do vendedor" />
              <p class="client-name">Vendedor desconhecido</p>
            </div>
            <div>
              <i class="fa-solid fa-phone"></i>
              <p class="client-phone">Número não informado</p>
            </div>
            <div>
              <i class="fa-solid fa-gem"></i>
              <p class="jewel-price">R$ ${jewel.price.toFixed(2)}</p>
            </div>
          </div>
          <div class="purchase-jewel">
            <p class="contact-title">Contato</p>
            <button class="buy-button main-button">Comprar</button>
          </div>
        </div>
      `;

      swiperWrapper.appendChild(jewelCard);
    });

    // Inicializa o Swiper
    new Swiper(".jewelry-swiper", {
      slidesPerView: 1,
      spaceBetween: 5,
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
      mousewheel: true,
      keyboard: true,
      breakpoints: {
        767: {
          slidesPerView: 2,
          setWrapperSize: true,
        },
      },
    });

    // Change description / contact
    const contactTitles = document.querySelectorAll(".contact-title");

    contactTitles.forEach((title) => {
      title.addEventListener("click", function () {
        const jewelDescription = this.closest(".carousel-item").querySelector(".jewel-description");
        const clientInfo = this.closest(".carousel-item").querySelector(".client-info");

        if (clientInfo.style.display === "none" || clientInfo.style.display === "") {
          // Exibir informações de contato e ocultar a descrição
          clientInfo.style.display = "block";
          jewelDescription.style.display = "none";
          this.innerText = "Descrição"; // Alterar o texto do botão
          this.classList.add("active-contact");
        } else {
          // Ocultar informações de contato e exibir a descrição novamente
          clientInfo.style.display = "none";
          jewelDescription.style.display = "block";
          this.innerText = "Contato"; // Alterar o texto do botão
          this.classList.remove("active-contact");
        }
      });
    });

  } catch (error) {
    console.error("Erro ao carregar as joias:", error);
  }

});
