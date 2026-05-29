const URL_BASE = "https://script.google.com/macros/s/AKfycbwjNuC7l7mLRaHyt0aWS8ATfAVgfQDmAdzHYydhZBdQPFuwZ2GA1VN6D-NCntENyQ4F/exec";

const URL_POSTAGENS = `${URL_BASE}?aba=Postagens`;
const URL_AGENDA    = `${URL_BASE}?aba=Agenda`;
const URL_PARCEIROS = `${URL_BASE}?aba=Parceiros`;

let todosOsProjetos = [];
let todosOsEventos = [];
let todosOsParceiros = []; 
let paginaAtual = 1;
const itensPorPagina = 6;

// --- INICIALIZAÇÃO *****ÍNCRONA ---
async function iniciar() {
  try {
    const [resPostagens, resAgenda, resParceiros] = await Promise.all([
        fetch(URL_POSTAGENS),
        fetch(URL_AGENDA),
        fetch(URL_PARCEIROS)
    ]);

    todosOsProjetos = await resPostagens.json();
    todosOsEventos = await resAgenda.json();
    todosOsParceiros = await resParceiros.json(); 

    const loader = document.getElementById("loader") || document.getElementById("loading-state");
    if (loader) loader.remove();

    if (document.getElementById("grid-agenda")) {
      renderizarAgenda();
    }

    if (document.getElementById("grid-projetos")) {
      renderizarHome();
    }

    if (document.getElementById("grid-parceiros")) {
      renderizarParceiros(); 
    }

    if (document.getElementById("p-titulo")) {
      renderizarDetalhes();
    }

    // Ativa o observador imediatamente após carregar e renderizar os dados da planilha
    if (typeof configurarObservador === "function") {
      configurarObservador();
    }

  } catch (error) {
    console.error("Erro ao carregar dados do portal:", error);
  }
}

function renderizarParceiros() {
  const gridParceiros = document.getElementById("grid-parceiros");
  if (!gridParceiros) return;
  
  gridParceiros.innerHTML = ""; 

  if (!todosOsParceiros || todosOsParceiros.length === 0 || todosOsParceiros.erro) {
    gridParceiros.innerHTML = `<p class="text-portal-text/40 text-xs italic">Espaço reservado para parceiros institucionais.</p>`;
    return;
  }

  todosOsParceiros.forEach((parceiro) => {
    const nomeParceiro = parceiro.nome || "Parceiro Institucional";
    const imagemParceiro = parceiro.imagem || "";

    gridParceiros.innerHTML += `
      <div class="flex flex-col items-center justify-center p-4 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 max-w-[150px]">
        <img src="${imagemParceiro}" alt="Logo ${nomeParceiro}" class="max-h-12 w-auto object-contain mb-2" onerror="this.src='https://placehold.co/150x50?text=${encodeURIComponent(nomeParceiro)}'">
        <span class="text-[10px] font-bold text-portal-text/40 uppercase tracking-wider text-center block md:hidden">${nomeParceiro}</span>
      </div>
    `;
  });
}

function renderizarAgenda() {
  const gridAgenda = document.getElementById("grid-agenda");
  if (!gridAgenda) return;
  
  gridAgenda.innerHTML = "";

  if (!todosOsEventos || todosOsEventos.length === 0 || todosOsEventos.erro) {
    gridAgenda.innerHTML = `<p class="text-portal-text/60 text-sm italic col-span-3">Nenhuma ação agendada no momento.</p>`;
    return;
  }

  todosOsEventos.forEach((evento) => {
    let horaFormatada = evento.hora || '--:--';

    if (typeof horaFormatada === 'string' && horaFormatada.includes('T')) {
      horaFormatada = horaFormatada.split('T')[1].substring(0, 5);
    }

    const diaVal = evento.dia || '00';
    const mesVal = evento.mes || 'MES';

    gridAgenda.innerHTML += `
      <div class="bg-portal-green border border-portal-text/10 p-6 rounded-xl flex gap-4 items-start transition-transform hover:scale-[1.02]">
        <div class="bg-portal-text text-white text-center p-3 rounded-lg font-bold min-w-[60px] shadow-sm">
          <span class="block text-xl leading-none">${diaVal}</span>
          <span class="text-xs uppercase font-medium">${mesVal}</span>
        </div>
        <div>
          <h4 class="font-bold text-portal-text text-lg leading-tight">${evento.titulo || 'Sem Título'}</h4>
          <p class="text-portal-text/60 text-xs mt-1 font-medium">${evento.local || 'Local não informado'} • ${horaFormatada}</p>
        </div>
      </div>
    `;
  });
}

function renderizarHome() {
  const gridHome = document.getElementById("grid-projetos");
  if (!gridHome) return;
  
  gridHome.innerHTML = ""; 

  todosOsProjetos.slice(0, 5).forEach((projeto) => {
    gridHome.innerHTML += criarCardHTML(projeto);
  });

  gridHome.innerHTML += `
      <div onclick="abrirModal()" class="bg-portal-blue/20 border-2 border-dashed border-portal-text/20 rounded-portal flex flex-col items-center justify-center p-10 text-center hover:bg-portal-green/40 hover:border-portal-text/40 transition-all cursor-pointer group">
            <h3 class="text-xl font-bold text-portal-text uppercase tracking-tight">Ver outras postagens</h3>
            <p class="text-portal-text/60 mt-1 font-semibold uppercase text-xs tracking-wider">Postagens antigas</p>
        </div>
    `;
}

function criarCardHTML(projeto) {
  const link = `post.html?projeto=${encodeURIComponent(projeto.titulo)}`;
  return `
       <div class="bg-portal-blue/30 border border-portal-text/10 rounded-portal p-6 flex flex-col transition-all hover:bg-white hover:shadow-xl hover:-translate-y-1">
            <img src="${projeto.imagem}" class="h-48 w-full object-cover rounded-lg mb-4">
            <span class="text-portal-text/60 text-[10px] font-bold uppercase tracking-widest w-fit mb-2">${projeto.categoria}</span>
            <h3 class="text-2xl font-bold text-portal-text mt-1 leading-tight">${projeto.titulo}</h3>
            <p class="text-portal-text/70 text-sm mt-2 line-clamp-2">${projeto.descricao || 'Conheça mais detalhes sobre esse projeto clicando abaixo.'}</p>
           <a href="${link}" class="mt-auto block text-center bg-portal-text text-white py-3 rounded-xl font-bold uppercase text-xs tracking-widest hover:opacity-90 transition-colors">
            Conhecer Projeto
        </a>
        </div>
    `;
}

function abrirModal() {
  paginaAtual = 1;
  const modal = document.getElementById("modal-acervo");
  if (modal) {
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    renderizarPaginaAcervo();
  }
}

function renderizarPaginaAcervo() {
  const gridAcervo = document.getElementById("grid-acervo");
  if (!gridAcervo) return;

  const inicio = (paginaAtual - 1) * itensPorPagina;
  const projetosExibidos = todosOsProjetos.slice(inicio, inicio + itensPorPagina);

  gridAcervo.innerHTML = "";
  projetosExibidos.forEach((projeto) => {
    gridAcervo.innerHTML += `
        <div class="flex items-center justify-between p-4 bg-portal-blue/10 border border-portal-text/5 rounded-xl hover:bg-portal-blue/20 transition-colors">
            <div class="flex items-center gap-4">
                <img src="${projeto.imagem}" class="w-14 h-14 object-cover rounded-lg border border-portal-text/5">
                <div>
                    <span class="text-[10px] font-bold text-portal-text/50 uppercase tracking-wider block">${projeto.categoria}</span>
                    <h4 class="font-bold text-portal-text text-base leading-tight">${projeto.titulo}</h4>
                </div>
            </div>
            <a href="post.html?projeto=${encodeURIComponent(projeto.titulo)}" class="bg-portal-green text-portal-text border border-portal-text/10 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-portal-text hover:text-white transition-all shadow-sm">
                Abrir
            </a>
        </div>
    `;
  });
  
  if (document.getElementById("pagina-atual")) {
    document.getElementById("pagina-atual").innerText = `Página ${paginaAtual}`;
  }
  if (document.getElementById("btn-prev")) {
    document.getElementById("btn-prev").disabled = paginaAtual === 1;
  }
  if (document.getElementById("btn-next")) {
    document.getElementById("btn-next").disabled = inicio + itensPorPagina >= todosOsProjetos.length;
  }
}

function mudarPagina(direcao) {
  paginaAtual += direcao;
  renderizarPaginaAcervo();
}

function fecharModal() {
  const modal = document.getElementById("modal-acervo");
  if (modal) {
    modal.classList.add("hidden");
    document.body.style.overflow = "auto";
  }
}

function abrirModalDoacao() {
  const modal = document.getElementById("modal-doacao");
  if (modal) {
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden"; 
  }
}

function fecharModalDoacao() {
  const modal = document.getElementById("modal-doacao");
  if (modal) {
    modal.classList.add("hidden");
    document.body.style.overflow = "auto"; 
  }
}

function copiarPix() {
  const elementoChave = document.getElementById("texto-chave");
  if (!elementoChave) return;

  const sampleChave = elementoChave.innerText;
  
  navigator.clipboard.writeText(sampleChave).then(() => {
    const alvo = document.querySelector("button[onclick='copiarPix()'] span:last-child");
    if (!alvo) return;

    const originalText = alvo.innerHTML;
    
    alvo.innerHTML = `<i class="fa-solid fa-check"></i> Copiado!`;
    alvo.classList.remove("bg-portal-text", "text-white");
    alvo.classList.add("bg-portal-green", "text-portal-text");

    setTimeout(() => {
      alvo.innerHTML = originalText;
      alvo.classList.remove("bg-portal-green", "text-portal-text");
      alvo.classList.add("bg-portal-text", "text-white");
    }, 2000);
  }).catch(err => {
    console.error("Erro ao copiar o Pix: ", err);
  });
}

// --- EFEITO DE SURGIMENTO AVANÇADO (SCROLL REVEAL COM CASCATA CORRIGIDO) ---
function configurarObservador() {
  const elementosParaRevelar = document.querySelectorAll(".revelar");

  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add("ativo");

        if (entrada.target.id === "grid-projetos" || entrada.target.id === "grid-agenda" || entrada.target.id === "grid-parceiros") {
          const filhos = entrada.target.children;
          Array.from(filhos).forEach((filho, index) => {
            filho.style.transition = `opacity 0.6s ease-out ${index * 0.15}s, transform 0.6s ease-out ${index * 0.15}s`;
            filho.style.opacity = "1";
            filho.style.transform = "translateY(0)";
          });
        }
        observador.unobserve(entrada.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: "0px 0px -30px 0px"
  });

  elementosParaRevelar.forEach((elemento) => {
    if (elemento.id === "grid-projetos" || elemento.id === "grid-agenda" || elemento.id === "grid-parceiros") {
      Array.from(elemento.children).forEach(filho => {
        filho.style.opacity = "0";
        filho.style.transform = "translateY(15px)";
      });
    }
    // CORRIGIDO: de elementona para elemento
    observador.observe(elemento);
  });
}

// Gatilho inicial para carregar elementos estáticos do HTML
document.addEventListener("DOMContentLoaded", () => {
  configurarObservador();
});

// --- FUNÇÕES DA PÁGINA DE DETALHES ---
function renderizarDetalhes() {
  const urlParams = new URLSearchParams(window.location.search);
  const nomeBuscado = urlParams.get("projeto");
  if (!nomeBuscado) return;

  const projeto = todosOsProjetos.find((p) => p.titulo === decodeURIComponent(nomeBuscado));

  if (projeto) {
    if (document.getElementById("p-titulo")) document.getElementById("p-titulo").innerText = projeto.titulo;
    if (document.getElementById("p-categoria")) document.getElementById("p-categoria").innerText = projeto.categoria;
    if (document.getElementById("p-imagem")) document.getElementById("p-imagem").src = projeto.imagem;
    
    // ATENÇÃO AQUI: Mudamos de .innerText para .innerHTML para aceitar tags HTML da planilha
    if (document.getElementById("p-descricao")) {
      document.getElementById("p-descricao").innerHTML = projeto.descricao;
    }
    
    if (document.getElementById("projeto-content")) document.getElementById("projeto-content").classList.remove("hidden");
  }
}

// Inicialização geral da aplicação
iniciar();
