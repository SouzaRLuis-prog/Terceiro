
const URL_BASE = "https://script.google.com/macros/s/AKfycbzyerF4pvHSlIjCejiTQdWDiSIn8KEHb5dAk3kYyAue-tDTX-IbrR-H-pe4xfq-8N8K/exec";

const URL_POSTAGENS = `${URL_BASE}?aba=Postagens`;
const URL_AGENDA    = `${URL_BASE}?aba=Agenda`;

let todosOsProjetos = [];
let todosOsEventos = [];
let paginaAtual = 1;
const itensPorPagina = 6;

// --- INICIALIZAÇÃO ASSÍNCRONA ---
async function iniciar() {
  try {
    // CORREÇÃO: Busca as postagens e a agenda simultaneamente
    const [resPostagens, resAgenda] = await Promise.all([
        fetch(URL_POSTAGENS),
        fetch(URL_AGENDA)
    ]);

    todosOsProjetos = await resPostagens.json();
    todosOsEventos = await resAgenda.json();

    // Remove o loader se ele existir
    const loader = document.getElementById("loader") || document.getElementById("loading-state");
    if (loader) loader.remove();

    // Roteamento inteligente
    if (document.getElementById("grid-agenda")) {
      renderizarAgenda();
    }

    if (document.getElementById("grid-projetos")) {
      renderizarHome();
    }

    if (document.getElementById("p-titulo")) {
      renderizarDetalhes();
    }
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
  }
}

// --- FUNÇÃO DA AGENDA DINÂMICA ---
function renderizarAgenda() {
  const gridAgenda = document.getElementById("grid-agenda");
  gridAgenda.innerHTML = "";

  if (!todosOsEventos || todosOsEventos.length === 0 || todosOsEventos.erro) {
    gridAgenda.innerHTML = `<p class="text-portal-text/60 text-sm italic col-span-3">Nenhuma ação agendada no momento.</p>`;
    return;
  }

  todosOsEventos.forEach((evento) => {
    // 1. CAPTURA A HORA BRUTA DA PLANILHA
    let horaFormatada = evento.hora || '--:--';

    // 2. A MÁGICA: Se a hora vier no formato de data longa (contendo o "T" do ISO), nós limpamos
    if (typeof horaFormatada === 'string' && horaFormatada.includes('T')) {
      // Pega apenas o pedaço da hora (ex: "13:06")
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

// --- FUNÇÕES DA HOME ---
function renderizarHome() {
  const gridHome = document.getElementById("grid-projetos");
  gridHome.innerHTML = ""; // Limpa antes de renderizar

  todosOsProjetos.slice(0, 5).forEach((projeto) => {
    gridHome.innerHTML += criarCardHTML(projeto);
  });

  // Adiciona o card de "Ver Antigos"
  gridHome.innerHTML += `
      <div onclick="abrirModal()" class="bg-portal-blue/20 border-2 border-dashed border-portal-text/20 rounded-portal flex flex-col items-center justify-center p-10 text-center hover:bg-portal-green/40 hover:border-portal-text/40 transition-all cursor-pointer group">
            <div class="w-14 h-14 bg-portal-text text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                <span class="text-2xl font-bold">+</span>
            </div>
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
            Ler Postagem
        </a>
        </div>
    `;
}

// --- FUNÇÕES DO MODAL (ACERVO) ---
function abrirModal() {
  paginaAtual = 1;
  document.getElementById("modal-acervo").classList.remove("hidden");
  document.body.style.overflow = "hidden";
  renderizarPaginaAcervo();
}

function renderizarPaginaAcervo() {
  const gridAcervo = document.getElementById("grid-acervo");
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

  document.getElementById("pagina-atual").innerText = `Página ${paginaAtual}`;
  document.getElementById("btn-prev").disabled = paginaAtual === 1;
  document.getElementById("btn-next").disabled = inicio + itensPorPagina >= todosOsProjetos.length;
}

function mudarPagina(direcao) {
  paginaAtual += direcao;
  renderizarPaginaAcervo();
}

function fecharModal() {
  document.getElementById("modal-acervo").classList.add("hidden");
  document.body.style.overflow = "auto";
}

// --- FUNÇÕES DA PÁGINA DE DETALHES ---
function renderizarDetalhes() {
  const urlParams = new URLSearchParams(window.location.search);
  const nomeBuscado = urlParams.get("projeto");
  const projeto = todosOsProjetos.find((p) => p.titulo === decodeURIComponent(nomeBuscado));

  if (projeto) {
    document.getElementById("p-titulo").innerText = projeto.titulo;
    document.getElementById("p-categoria").innerText = projeto.categoria;
    document.getElementById("p-imagem").src = projeto.imagem;
    document.getElementById("p-descricao").innerText = projeto.descricao;
    document.getElementById("projeto-content").classList.remove("hidden");
  }
}

// Executa a inicialização
iniciar();