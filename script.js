// Dados de demonstração: os títulos e a disponibilidade não são dados reais.
// Acrescente novos objetos à lista, com IDs únicos. Não há limite de seis obras.
// imagem_path é relativo ao index.html: use o nome exato da foto local ou
// coloque novas fotos em imagens/ e use, por exemplo, "imagens/minha-obra.jpg".
// Técnica e dimensões ficam vazias e preço fica null até haver dados confirmados.
const obrasExemplo = [
    {
        id: "exemplo-1",
        titulo: "Obra de exemplo 01",
        legenda: "Foto local para demonstração da galeria — exemplo 01.",
        imagem_path: "WhatsApp Image 2026-09-29 at 20.04.16.jpeg",
        largura: 1280,
        altura: 1260,
        tecnica: "",
        dimensoes: "",
        preco: null,
        vendida: false,
    },
    {
        id: "exemplo-2",
        titulo: "Obra de exemplo 02",
        legenda: "Foto local para demonstração da galeria — exemplo 02.",
        imagem_path: "WhatsApp Image 2026-09-29 at 20.04.16 (1).jpeg",
        largura: 1280,
        altura: 864,
        tecnica: "",
        dimensoes: "",
        preco: null,
        vendida: true,
    },
    {
        id: "exemplo-3",
        titulo: "Obra de exemplo 03",
        legenda: "Foto local para demonstração da galeria — exemplo 03.",
        imagem_path: "WhatsApp Image 2026-09-29 at 20.04.17.jpeg",
        largura: 1132,
        altura: 1600,
        tecnica: "",
        dimensoes: "",
        preco: null,
        vendida: false,
    },
    {
        id: "exemplo-4",
        titulo: "Obra de exemplo 04",
        legenda: "Foto local para demonstração da galeria — exemplo 04.",
        imagem_path: "WhatsApp Image 2026-09-29 at 20.04.17 (1).jpeg",
        largura: 1132,
        altura: 1600,
        tecnica: "",
        dimensoes: "",
        preco: null,
        vendida: false,
    },
    {
        id: "exemplo-5",
        titulo: "Obra de exemplo 05",
        legenda: "Foto local para demonstração da galeria — exemplo 05.",
        imagem_path: "WhatsApp Image 2026-09-29 at 20.04.17 (2).jpeg",
        largura: 1132,
        altura: 1600,
        tecnica: "",
        dimensoes: "",
        preco: null,
        vendida: true,
    },
    {
        id: "exemplo-6",
        titulo: "Obra de exemplo 06",
        legenda: "Foto local para demonstração da galeria — exemplo 06.",
        imagem_path: "WhatsApp Image 2026-09-29 at 20.04.17 (3).jpeg",
        largura: 1600,
        altura: 1132,
        tecnica: "",
        dimensoes: "",
        preco: null,
        vendida: false,
    },
];

async function carregarObras() {
    // No futuro, consulte o Supabase aqui e retorne uma lista com os mesmos campos.
    return obrasExemplo;
}

function criarImagemObra(obra) {
    const moldura = document.createElement("div");
    moldura.className = "obra-imagem";

    function mostrarPlaceholder() {
        const placeholder = document.createElement("p");
        placeholder.className = "obra-placeholder";
        placeholder.textContent = "Imagem indisponível";
        moldura.replaceChildren(placeholder);
    }

    if (obra.imagem_path) {
        const imagem = document.createElement("img");
        imagem.alt = `Fotografia da obra: ${obra.titulo}`;
        imagem.loading = "lazy";
        imagem.decoding = "async";
        imagem.draggable = false;
        if (obra.largura && obra.altura) {
            imagem.width = obra.largura;
            imagem.height = obra.altura;
        }
        imagem.addEventListener("error", mostrarPlaceholder, { once: true });
        imagem.src = obra.imagem_path;
        moldura.append(imagem);
    } else {
        mostrarPlaceholder();
    }

    return moldura;
}

function renderizarObras(obras) {
    const galeria = document.getElementById("galeria-obras");
    const status = document.getElementById("galeria-status");
    const cartoes = document.createDocumentFragment();

    for (const obra of obras) {
        const cartao = document.createElement("article");
        cartao.className = "obra-card";
        cartao.dataset.obraId = obra.id;

        const figura = document.createElement("figure");
        const legenda = document.createElement("figcaption");
        const descricao = document.createElement("p");
        descricao.textContent = obra.legenda;

        const titulo = document.createElement("h3");
        titulo.textContent = obra.titulo;

        const disponibilidade = document.createElement("p");
        disponibilidade.className = "obra-disponibilidade";
        disponibilidade.textContent = obra.vendida ? "Vendida" : "Disponível";
        if (obra.vendida) {
            disponibilidade.classList.add("obra-disponibilidade--vendida");
        }

        legenda.append(titulo, descricao, disponibilidade);
        figura.append(criarImagemObra(obra), legenda);
        cartao.append(figura);
        cartoes.append(cartao);
    }

    galeria.replaceChildren(cartoes);
    status.textContent = obras.length === 0 ? "Nenhuma obra disponível no momento." : "";
    status.hidden = obras.length > 0;
}

async function iniciarGaleria() {
    try {
        const obras = await carregarObras();
        renderizarObras(obras);
    } catch (erro) {
        const status = document.getElementById("galeria-status");
        status.hidden = false;
        status.textContent = "Não foi possível carregar as obras. Tente atualizar a página.";
        console.error("Erro ao carregar a galeria:", erro);
    }
}

iniciarGaleria();

function iniciarPasseio() {
    const botao = document.getElementById("passeio-botao");
    const status = document.getElementById("passeio-status");
    const movimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)");
    const velocidade = 24; // Pixels por segundo, independente da taxa de atualização.
    const toleranciaArrasto = 10; // Pequenos tremores do dedo ainda contam como segurar.
    let estado = "pronto";
    let quadro = null;
    let ultimoTempo = null;
    let posicao = window.scrollY;
    let rolagemEsperada = window.scrollY;
    let toque = null;

    // Mede também quebras de linha, zoom e mudanças de orientação do aparelho.
    const header = document.querySelector("header");
    const medirHeader = () => document.documentElement.style.setProperty(
        "--header-altura", `${header.getBoundingClientRect().height}px`
    );
    botao.hidden = false;
    document.querySelector(".passeio-instrucoes").hidden = false;
    medirHeader();
    new ResizeObserver(medirHeader).observe(header);

    function atualizarInterface(mensagem) {
        const ativo = estado === "andando" || estado === "segurando";
        document.body.classList.toggle("passeio-ativo", ativo);
        botao.disabled = movimentoReduzido.matches;
        botao.textContent = movimentoReduzido.matches ? "Passeio desativado"
            : ativo ? "Pausar passeio"
            : estado === "pausado" ? "Retomar passeio" : "Iniciar passeio";
        status.textContent = mensagem;
    }

    function pararQuadros() {
        if (quadro !== null) cancelAnimationFrame(quadro);
        quadro = null;
        ultimoTempo = null;
    }

    function pausar(mensagem = "Passeio pausado. Use o botão para retomar.") {
        pararQuadros();
        estado = "pausado";
        toque = null;
        atualizarInterface(mensagem);
    }

    function avancar(tempo) {
        quadro = null;
        if (estado !== "andando") return;
        if (movimentoReduzido.matches) {
            aplicarPreferenciaMovimento();
            return;
        }
        if (Math.abs(window.scrollY - rolagemEsperada) > 2) {
            pausar();
            return;
        }
        // Um quadro atrasado não deve causar um salto na página.
        const segundos = ultimoTempo === null ? 0 : Math.min((tempo - ultimoTempo) / 1000, 0.05);
        ultimoTempo = tempo;
        const limite = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        posicao = Math.min(posicao + velocidade * segundos, limite);
        window.scrollTo({ top: posicao, left: window.scrollX, behavior: "instant" });
        rolagemEsperada = window.scrollY;
        if (posicao >= limite) {
            pausar("Fim do passeio. Você pode explorar a página livremente.");
            return;
        }
        quadro = requestAnimationFrame(avancar);
    }

    function continuar() {
        if (movimentoReduzido.matches) return;
        pararQuadros();
        // Não reaproveita tempo acumulado durante a pausa nem muda o ponto de leitura.
        posicao = window.scrollY;
        rolagemEsperada = window.scrollY;
        estado = "andando";
        atualizarInterface("Passeio em andamento. Segure uma obra para pausar.");
        quadro = requestAnimationFrame(avancar);
    }

    botao.addEventListener("click", () => {
        if (estado === "andando" || estado === "segurando") pausar();
        else continuar();
    });

    window.addEventListener("pointerdown", (evento) => {
        if (estado !== "andando" && estado !== "segurando") return;
        if (!evento.isPrimary || toque) {
            pausar(); // Pinça/múltiplos dedos devolvem o controle à pessoa.
            return;
        }
        if (evento.target.closest("#passeio-botao")) return;
        const obra = evento.target.closest(".obra-card, .obra-destaque");
        if (!obra || evento.button !== 0 || evento.target.closest("a, button, input, select, textarea")) {
            pausar();
            return;
        }
        toque = { id: evento.pointerId, x: evento.clientX, y: evento.clientY };
        pararQuadros();
        estado = "segurando";
        atualizarInterface("Passeio pausado enquanto você segura a obra. Solte para continuar.");
    }, { passive: true });

    window.addEventListener("pointermove", (evento) => {
        if (!toque || evento.pointerId !== toque.id) return;
        if (Math.hypot(evento.clientX - toque.x, evento.clientY - toque.y) > toleranciaArrasto) {
            pausar();
        }
    }, { passive: true });

    window.addEventListener("pointerup", (evento) => {
        if (!toque || evento.pointerId !== toque.id) return;
        const arrastou = Math.hypot(evento.clientX - toque.x, evento.clientY - toque.y) > toleranciaArrasto;
        toque = null;
        if (arrastou) pausar();
        else if (estado === "segurando") continuar();
    }, { passive: true });

    window.addEventListener("pointercancel", () => {
        if (toque) pausar(); // O navegador assumiu o gesto nativo de rolagem/zoom.
    }, { passive: true });

    window.addEventListener("contextmenu", (evento) => {
        if (estado === "segurando" && evento.target.closest(".obra-card, .obra-destaque")) {
            evento.preventDefault();
        }
    });

    function pausarSeAtivo() {
        if (estado === "andando" || estado === "segurando") pausar();
    }

    window.addEventListener("wheel", pausarSeAtivo, { passive: true });
    window.addEventListener("keydown", (evento) => {
        if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "PageDown", "PageUp", "Home", "End", " ", "Escape", "Tab"].includes(evento.key)) {
            // Espaço no botão deve manter sua ativação nativa, sem pausar e reiniciar.
            if (evento.key === " " && evento.target === botao) return;
            pausarSeAtivo();
        }
    });
    window.addEventListener("scroll", () => {
        // Reconhece também rolagem por barra, acessibilidade ou outro mecanismo nativo.
        if (Math.abs(window.scrollY - rolagemEsperada) > 2) pausarSeAtivo();
    }, { passive: true });
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) pausarSeAtivo();
    });
    window.addEventListener("blur", pausarSeAtivo);
    window.addEventListener("pagehide", pausarSeAtivo);
    let larguraJanela = window.innerWidth;
    window.addEventListener("resize", () => {
        // A barra de endereço móvel pode alterar só a altura durante o passeio.
        if (window.innerWidth !== larguraJanela) pausarSeAtivo();
        larguraJanela = window.innerWidth;
    }, { passive: true });

    function aplicarPreferenciaMovimento() {
        pausar(movimentoReduzido.matches
            ? "Movimento reduzido ativado no dispositivo. Explore a galeria com rolagem manual."
            : "Passeio pronto. Use o botão para iniciar.");
        estado = "pronto";
        atualizarInterface(status.textContent);
    }
    movimentoReduzido.addEventListener("change", aplicarPreferenciaMovimento);
    aplicarPreferenciaMovimento();
}

iniciarPasseio();
