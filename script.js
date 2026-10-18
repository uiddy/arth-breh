const SUPABASE_URL = "https://pfvopboqnpeijcvawqiy.supabase.co";
const SUPABASE_CHAVE = "sb_publishable_SMyurOHpLT0dm_SAbgOWpg_Za3rdHsl";

let clienteSupabase;// 1. Configuração e dados locais. Preencha apenas com contatos reais.

const configuracaoContato = {
    whatsapp: "554184083795", // Número internacional, com DDI e DDD; somente dígitos.
    instagram: "https://www.instagram.com/artbreh/", // URL HTTPS completa do perfil da artista.
    email: "", // Preencha para ativar o botão de e-mail.
};

// Dados de demonstração: os títulos e a disponibilidade não são dados reais.
// Acrescente novos objetos à lista, com IDs únicos. Não há limite de seis obras.
// Cada obra tem sua própria lista de fotos, na ordem do carrossel.
// Para acrescentar ângulos DO MESMO quadro, adicione itens em fotos:
// fotos: [
//     { src: "imagens/quadro-frente.jpg", alt: "Vista frontal do quadro" },
//     { src: "imagens/quadro-lateral.jpg", alt: "Vista lateral do quadro" },
//     { src: "imagens/quadro-detalhe.jpg", alt: "Detalhe da pintura" },
// ],
// Os caminhos são relativos ao index.html. Use apenas arquivos existentes.
// As fotos locais atuais mostram obras diferentes: não são ângulos da mesma obra.
// Técnica e dimensões ficam vazias e preço fica null até haver dados confirmados.
const obrasExemplo = [
    {
        id: "exemplo-1",
        titulo: "Obra de exemplo 01",
        legenda: "Foto local para demonstração da galeria — exemplo 01.",
        fotos: [{
            src: "WhatsApp Image 2026-09-29 at 20.04.16.jpeg",
            alt: "Pintura de uma rosa branca sobre fundo preto salpicado de branco",
            largura: 1280,
            ordem: 0,
            altura: 1260,
        }],
        tecnica: "",
        dimensoes: "",
        preco: null,
        vendida: false,
        destaque: true,
        ordem: 0,
    },
    {
        id: "exemplo-2",
        titulo: "Obra de exemplo 02",
        legenda: "Foto local para demonstração da galeria — exemplo 02.",
        fotos: [{
            src: "WhatsApp Image 2026-09-29 at 20.04.16 (1).jpeg",
            alt: "Paisagem noturna azul com árvores e um caminho iluminado",
            largura: 1280,
            ordem: 0,
            altura: 864,
        }],
        tecnica: "",
        dimensoes: "",
        preco: null,
        vendida: true,
        destaque: false,
        ordem: 1,
    },
    {
        id: "exemplo-3",
        titulo: "Obra de exemplo 03",
        legenda: "Foto local para demonstração da galeria — exemplo 03.",
        fotos: [{
            src: "WhatsApp Image 2026-09-29 at 20.04.17.jpeg",
            alt: "Pintura de uma rosa vermelha em chamas sobre fundo claro",
            largura: 1132,
            ordem: 0,
            altura: 1600,
        }],
        tecnica: "",
        dimensoes: "",
        preco: null,
        vendida: false,
        destaque: false,
        ordem: 2,
    },
    {
        id: "exemplo-4",
        titulo: "Obra de exemplo 04",
        legenda: "Foto local para demonstração da galeria — exemplo 04.",
        fotos: [{
            src: "WhatsApp Image 2026-09-29 at 20.04.17 (1).jpeg",
            alt: "Buquê de flores roxas com uma borboleta e um pingente",
            largura: 1132,
            ordem: 0,
            altura: 1600,
        }],
        tecnica: "",
        dimensoes: "",
        preco: null,
        vendida: false,
        destaque: false,
        ordem: 3,
    },
    {
        id: "exemplo-5",
        titulo: "Obra de exemplo 05",
        legenda: "Foto local para demonstração da galeria — exemplo 05.",
        fotos: [{
            src: "WhatsApp Image 2026-09-29 at 20.04.17 (2).jpeg",
            alt: "Borboleta roxa cercada por uma espiral azul e branca",
            largura: 1132,
            ordem: 0,
            altura: 1600,
        }],
        tecnica: "",
        dimensoes: "",
        preco: null,
        vendida: true,
        destaque: false,
        ordem: 4,
    },
    {
        id: "exemplo-6",
        titulo: "Obra de exemplo 06",
        legenda: "Foto local para demonstração da galeria — exemplo 06.",
        fotos: [{
            src: "WhatsApp Image 2026-09-29 at 20.04.17 (3).jpeg",
            alt: "Montanhas sob um céu estrelado vistas através de arcos ornamentados",
            largura: 1600,
            ordem: 0,
            altura: 1132,
        }],
        tecnica: "",
        dimensoes: "",
        preco: null,
        vendida: false,
        destaque: false,
        ordem: 5,
    },
];

// 2. Obtenção e normalização. O visual recebe somente este modelo normalizado.
async function carregarObras() {
    if (!window.supabase) {
        throw new Error("A biblioteca do Supabase não carregou.");
    }

    if (!clienteSupabase) {
        clienteSupabase = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_CHAVE
        );
    }

    const campos = "id, titulo, legenda, imagem_path, tecnica, dimensoes, preco, vendida, created_at";
    const consultar = selecao => clienteSupabase
        .from("obras")
        .select(selecao)
        .order("created_at", { ascending: false })
        .order("id", { ascending: true });

    let { data, error } = await consultar(`${campos}, imagem_verso_path, imagem_textura_path`);

    // Obras antigas continuam visíveis antes da migração das fotos adicionais.
    if (error && ["42703", "PGRST204"].includes(error.code)
        && /imagem_(verso|textura)_path/.test(error.message)) {
        ({ data, error } = await consultar(campos));
    }

    if (error) throw error;

    return (data ?? []).map(obra => {
        const fotos = [];

        const camposFotos = [
            { campo: "imagem_path", descricao: "Frente" },
            { campo: "imagem_verso_path", descricao: "Verso" },
            { campo: "imagem_textura_path", descricao: "Textura" }
        ];

        for (const { campo, descricao } of camposFotos) {
            const caminho = (obra[campo] ?? "").trim();
            if (!caminho) continue;

            const { data: imagem } = clienteSupabase.storage
                .from("obras")
                .getPublicUrl(caminho);

            fotos.push({
                src: imagem.publicUrl,
                imagem_path: caminho,
                alt: `${descricao} da obra ${obra.titulo}`
            });
        }

        return {
            ...obra,
            fotos
        };
    });
}
    // Integração futura: substituir este retorno pela leitura no Supabase.
    // Retorne a lista ou lance um erro; a interface já trata os dois caminhos.
function texto(valor) {
    return typeof valor === "string" ? valor.trim() : "";
}

function numeroOuNull(valor) {
    if (typeof valor !== "number" && typeof valor !== "string") return null;
    if (typeof valor === "string" && !valor.trim()) return null;
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
}

function booleano(valor) {
    return valor === true || valor === "true" || valor === 1;
}

function resolverUrlImagem(foto) {
    // src é a URL exibida; imagem_path é o caminho do arquivo no armazenamento.
    // Por enquanto, caminhos são locais. No futuro, resolva a URL pública/assinada
    // do Storage aqui, preservando imagem_path para substituir/excluir o arquivo.
    const origem = texto(foto.src) || texto(foto.imagem_path);
    if (!origem) return "";
    try {
        const url = new URL(origem, document.baseURI);
        return ["http:", "https:", "file:"].includes(url.protocol) ? origem : "";
    } catch {
        return "";
    }
}

function normalizarObras(dados) {
    if (!Array.isArray(dados)) throw new TypeError("A fonte de obras deve retornar uma lista.");
    const ids = new Set();
    return dados.filter(obra => obra && typeof obra === "object" && !Array.isArray(obra))
        .map((obra, indice) => {
            const idBase = texto(obra.id) || (typeof obra.id === "number" ? String(obra.id) : `obra-${indice + 1}`);
            let id = idBase;
            let sufixo = 2;
            while (ids.has(id)) id = `${idBase}-${sufixo++}`;
            ids.add(id);
            const titulo = texto(obra.titulo) || "Obra sem título";
            const preco = numeroOuNull(obra.preco);
            let fotos = Array.isArray(obra.fotos)
                ? obra.fotos.filter(foto => foto && typeof foto === "object" && !Array.isArray(foto)) : [];
            if (!fotos.length && texto(obra.imagem_path)) {
                fotos = [{ imagem_path: obra.imagem_path, largura: obra.largura, altura: obra.altura }];
            }
            return {
                id,
                titulo,
                legenda: texto(obra.legenda),
                tecnica: texto(obra.tecnica),
                dimensoes: texto(obra.dimensoes),
                preco: preco !== null && preco >= 0 ? preco : null,
                vendida: booleano(obra.vendida),
                destaque: booleano(obra.destaque),
                ordem: numeroOuNull(obra.ordem) ?? indice,
                fotos: fotos.map((foto, fotoIndice) => ({
                    src: resolverUrlImagem(foto),
                    imagem_path: texto(foto.imagem_path),
                    alt: texto(foto.alt) || `Fotografia de ${titulo}`,
                    largura: numeroOuNull(foto.largura) > 0 ? Math.round(Number(foto.largura)) : null,
                    altura: numeroOuNull(foto.altura) > 0 ? Math.round(Number(foto.altura)) : null,
                    ordem: numeroOuNull(foto.ordem) ?? fotoIndice,
                })).sort((a, b) => a.ordem - b.ordem),
            };
        }).sort((a, b) => a.ordem - b.ordem);
}

const formatoPreco = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const preferenciaMovimento = window.matchMedia("(prefers-reduced-motion: reduce)");
let obrasPorId = new Map();
let sequenciaElemento = 0;
const limparCarrossel = new WeakMap();

function elemento(tag, classe, conteudo) {
    const node = document.createElement(tag);
    if (classe) node.className = classe;
    if (conteudo !== undefined) node.textContent = conteudo;
    return node;
}

// 3. Contatos. Nenhum link é publicado enquanto a configuração estiver vazia.
function obterContatos() {
    const numero = texto(configuracaoContato.whatsapp).replace(/[\s()+-]/g, "");
    const whatsapp = /^\d{10,15}$/.test(numero) ? numero : "";
    const email = texto(configuracaoContato.email);
    let instagram = "";
    try {
        const url = new URL(texto(configuracaoContato.instagram));
        if (url.protocol === "https:" && ["instagram.com", "www.instagram.com"].includes(url.hostname)
            && !url.username && !url.password && url.pathname !== "/") instagram = url.href;
    } catch { /* Um perfil ainda não configurado não gera link. */ }
    return { whatsapp, instagram, email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "" };
}

function linkExterno(rotulo, href) {
    const link = elemento("a", "botao botao--secundario", rotulo);
    link.href = href;
    if (href.startsWith("https:")) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
    }
    return link;
}

function criarAcaoContato(obra) {
    const { whatsapp } = obterContatos();
    const rotulo = obra.vendida ? "Consultar artista" : "Consultar obra";
    const mensagem = obra.vendida
        ? `Olá! Vi a obra “${obra.titulo}”, que está vendida, e gostaria de conhecer mais sobre o trabalho da artista.`
        : `Olá! Gostaria de saber mais sobre a obra “${obra.titulo}”.`;
    const href = whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensagem)}` : "#contato";
    const link = linkExterno(rotulo, href);
    link.className = "botao botao--secundario obra-consultar";
    link.setAttribute("aria-label", `${rotulo}: ${obra.titulo}`);
    return link;
}

function renderizarContatos() {
    // Remove o botão antigo caso o navegador ainda esteja usando o HTML anterior.
    document.querySelectorAll("#whatsapp-flutuante, .whatsapp-flutuante")
        .forEach(botao => botao.remove());

    const { whatsapp, instagram, email } = obterContatos();
    const links = document.getElementById("contato-links");
    const canais = [];
    if (whatsapp) {
        const href = `https://wa.me/${whatsapp}`;
        const botao = linkExterno("", href);
        botao.className = "botao contato-cta botao--whatsapp";
        botao.append(elemento("span", "", "Conversar pelo WhatsApp"));
        botao.prepend(criarIconeWhatsApp());
        canais.push(botao);
    }
    const botaoEmail = email
        ? linkExterno("", `mailto:${encodeURIComponent(email)}`)
        : elemento("button");
    botaoEmail.className = "botao contato-cta botao--email";
    botaoEmail.append(criarIconeEmail(), elemento("span", "", "Enviar um e-mail"));
    const grupoEmail = elemento("div", "contato-email");
    grupoEmail.append(botaoEmail);
    if (!email) {
        botaoEmail.type = "button";
        botaoEmail.disabled = true;
        botaoEmail.setAttribute("aria-describedby", "email-disponibilidade");
        const aviso = elemento("p", "contato-aviso", "E-mail disponível em breve");
        aviso.id = "email-disponibilidade";
        grupoEmail.append(aviso);
    }
    canais.push(grupoEmail);
    if (instagram) {
        const link = linkExterno("", instagram);
        link.className = "botao contato-cta contato-instagram";
        link.append(criarIconeInstagram(), elemento("span", "", "Visitar o Instagram"));
        canais.push(link);
    }
    links.replaceChildren(...canais);
    document.getElementById("contato-status").hidden = canais.length > 0;
}

function criarIconeWhatsApp() {
    // Simple Icons (CC0): https://github.com/simple-icons/simple-icons/blob/develop/icons/whatsapp.svg
    // SVG preenchido: não usar o helper de ícones de contorno.
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "currentColor");
    svg.setAttribute("stroke", "none");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z");
    svg.append(path);
    return svg;
}

function criarIconeEmail() {
    const svg = criarIcone("M3 6h18v12H3z M3 6l9 7 9-7");
    svg.classList.add("icone-email");
    return svg;
}

function criarIconeInstagram() {
    return criarIcone("M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Z M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M17.5 6.5h.01");
}

// 4. Fotos e carrossel, compartilhados pela galeria, pelo destaque e pelo dialog.
function criarImagemObra(foto, obra, indice, total, prioridade = false) {
    const moldura = elemento("div", "obra-imagem");
    if (total > 1) {
        moldura.setAttribute("role", "group");
        moldura.setAttribute("aria-roledescription", "slide");
        moldura.setAttribute("aria-label", `Foto ${indice + 1} de ${total}`);
    }
    function mostrarPlaceholder() {
        moldura.replaceChildren(elemento("p", "obra-placeholder", "Imagem indisponível"));
    }
    if (!foto.src) {
        mostrarPlaceholder();
        return moldura;
    }
    const imagem = document.createElement("img");
    imagem.alt = foto.alt || `Fotografia da obra: ${obra.titulo}`;
    imagem.loading = prioridade ? "eager" : "lazy";
    imagem.decoding = "async";
    imagem.draggable = false;
    if (foto.largura && foto.altura) {
        imagem.width = foto.largura;
        imagem.height = foto.altura;
    }
    imagem.addEventListener("error", mostrarPlaceholder, { once: true });
    imagem.src = foto.src;
    moldura.append(imagem);
    return moldura;
}

function criarIcone(caminho) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    for (const [nome, valor] of Object.entries({
        viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
        "stroke-width": "1.7", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true",
    })) svg.setAttribute(nome, valor);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", caminho);
    svg.append(path);
    return svg;
}

function descartarCarrosseis(container) {
    container.querySelectorAll(".obra-fotos").forEach(moldura => {
        limparCarrossel.get(moldura)?.();
        limparCarrossel.delete(moldura);
    });
}

function criarCarrosselObra(obra, { prioridade = false, indiceInicial = 0 } = {}) {
    const fotos = obra.fotos.length ? obra.fotos : [{ src: "" }];
    const moldura = elemento("div", "obra-fotos");
    const carrossel = elemento("div", "obra-carrossel");
    carrossel.id = `fotos-${++sequenciaElemento}`;
    carrossel.setAttribute("role", "region");
    carrossel.setAttribute("aria-label", `Fotos de ${obra.titulo}`);
    fotos.forEach((foto, indice) => {
        carrossel.append(criarImagemObra(foto, obra, indice, fotos.length, prioridade && indice === indiceInicial));
    });
    moldura.append(carrossel);
    if (fotos.length < 2) return moldura;

    moldura.classList.add("obra-fotos--multiplo");
    carrossel.classList.add("obra-carrossel--multiplo");
    carrossel.tabIndex = 0;
    carrossel.setAttribute("aria-roledescription", "carrossel");
    const eventos = new AbortController();
    const { signal } = eventos;
    let indiceAtual = Math.max(0, Math.min(indiceInicial, fotos.length - 1));
    let larguraAnterior = 0;
    let quadroScroll = null;
    let arrasto = null;

    const contador = elemento("div", "obra-contador");
    contador.setAttribute("role", "status");
    contador.setAttribute("aria-live", "polite");
    contador.setAttribute("aria-atomic", "true");
    const contagem = elemento("span");
    contagem.setAttribute("aria-hidden", "true");
    const anuncio = elemento("span", "sr-only");
    contador.append(criarIcone("M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM3 17l6-6 4 4 3-3 5 5M8 7h.01"), contagem, anuncio);
    moldura.append(contador);

    const larguraFoto = () => carrossel.getBoundingClientRect().width;
    function irParaFoto(indice, imediato = false) {
        const destino = Math.max(0, Math.min(indice, fotos.length - 1));
        carrossel.scrollTo({
            left: destino * larguraFoto(),
            behavior: imediato || preferenciaMovimento.matches ? "instant" : "smooth",
        });
    }
    function criarSeta(direcao, nome, caminho) {
        const botao = elemento("button", `obra-seta obra-seta--${nome}`);
        botao.type = "button";
        botao.setAttribute("aria-label", `Foto ${nome === "anterior" ? "anterior" : "seguinte"} de ${obra.titulo}`);
        botao.setAttribute("aria-controls", carrossel.id);
        botao.append(criarIcone(caminho));
        botao.addEventListener("click", () => {
            if (botao.getAttribute("aria-disabled") !== "true") irParaFoto(indiceAtual + direcao);
        }, { signal });
        moldura.append(botao);
        return botao;
    }
    const anterior = criarSeta(-1, "anterior", "m14 6-6 6 6 6");
    const proxima = criarSeta(1, "proxima", "m10 6 6 6-6 6");
    function atualizarControles() {
        // aria-disabled mantém o foco no controle quando se chega à última foto.
        anterior.setAttribute("aria-disabled", String(indiceAtual === 0));
        proxima.setAttribute("aria-disabled", String(indiceAtual === fotos.length - 1));
        contagem.textContent = `${indiceAtual + 1} / ${fotos.length}`;
        anuncio.textContent = `Foto ${indiceAtual + 1} de ${fotos.length}`;
        carrossel.dataset.fotoAtual = indiceAtual;
    }
    carrossel.addEventListener("scroll", () => {
        if (quadroScroll !== null) return;
        quadroScroll = requestAnimationFrame(() => {
            quadroScroll = null;
            const largura = larguraFoto();
            if (!largura || largura !== larguraAnterior) return;
            const indice = Math.max(0, Math.min(fotos.length - 1, Math.round(carrossel.scrollLeft / largura)));
            if (indice !== indiceAtual) {
                indiceAtual = indice;
                atualizarControles();
            }
        });
    }, { passive: true, signal });
    carrossel.addEventListener("keydown", (evento) => {
        if (evento.altKey || evento.ctrlKey || evento.metaKey || evento.shiftKey) return;
        const destinos = { ArrowLeft: indiceAtual - 1, ArrowRight: indiceAtual + 1, Home: 0, End: fotos.length - 1 };
        if (!Object.hasOwn(destinos, evento.key)) return;
        evento.preventDefault();
        irParaFoto(destinos[evento.key]);
    }, { signal });

    // Toque/trackpad permanecem nativos, permitindo rolagem vertical e pinça.
    carrossel.addEventListener("pointerdown", (evento) => {
        if (evento.pointerType !== "mouse" || evento.button !== 0) return;
        arrasto = { id: evento.pointerId, x: evento.clientX, inicio: carrossel.scrollLeft };
        carrossel.classList.add("obra-carrossel--arrastando");
        carrossel.setPointerCapture(evento.pointerId);
        carrossel.focus({ preventScroll: true });
        evento.preventDefault();
    }, { signal });
    carrossel.addEventListener("pointermove", (evento) => {
        if (arrasto && evento.pointerId === arrasto.id) carrossel.scrollLeft = arrasto.inicio + arrasto.x - evento.clientX;
    }, { signal });
    function encerrarArrasto(evento) {
        if (!arrasto || evento.pointerId !== arrasto.id) return;
        const destino = Math.round(carrossel.scrollLeft / larguraFoto());
        arrasto = null;
        carrossel.classList.remove("obra-carrossel--arrastando");
        if (carrossel.hasPointerCapture(evento.pointerId)) carrossel.releasePointerCapture(evento.pointerId);
        irParaFoto(destino);
    }
    for (const tipo of ["pointerup", "pointercancel", "lostpointercapture"]) {
        carrossel.addEventListener(tipo, encerrarArrasto, { signal });
    }
    const observador = new ResizeObserver(() => {
        const largura = larguraFoto();
        if (largura && largura !== larguraAnterior) {
            larguraAnterior = largura;
            irParaFoto(indiceAtual, true);
        }
    });
    observador.observe(carrossel);
    limparCarrossel.set(moldura, () => {
        eventos.abort();
        observador.disconnect();
        if (quadroScroll !== null) cancelAnimationFrame(quadroScroll);
    });
    atualizarControles();
    return moldura;
}

// 5. Renderização: os três contextos usam a mesma obra normalizada.
function criarInformacoesObra(obra, contexto = "galeria") {
    const detalhes = contexto === "detalhes";
    const destaque = contexto === "destaque";
    const info = elemento(detalhes ? "div" : "figcaption", detalhes ? "detalhes-informacoes" : "");
    if (destaque) info.append(elemento("p", "sobrelinha", "Obra em destaque"));
    const titulo = elemento(detalhes || destaque ? "h2" : "h3", "obra-titulo", obra.titulo);
    titulo.id = detalhes ? "detalhes-titulo" : `titulo-obra-${++sequenciaElemento}`;
    info.append(titulo);
    if (detalhes && obra.legenda) info.append(elemento("p", "obra-descricao", obra.legenda));
    if (!destaque && (obra.tecnica || obra.dimensoes)) {
        const ficha = elemento("div", "obra-ficha");
        if (obra.tecnica) ficha.append(elemento("p", "obra-tecnica", `Técnica: ${obra.tecnica}`));
        if (obra.dimensoes) ficha.append(elemento("p", "obra-dimensoes", `Dimensões: ${obra.dimensoes}`));
        info.append(ficha);
    }
    if (obra.preco !== null) info.append(elemento("p", "obra-preco", formatoPreco.format(obra.preco)));
    const disponibilidade = elemento("p", "obra-disponibilidade", obra.vendida ? "Vendida" : "Disponível");
    if (obra.vendida) disponibilidade.classList.add("obra-disponibilidade--vendida");
    info.append(disponibilidade);
    const acoes = elemento("div", "obra-acoes");
    if (!detalhes) {
        const botao = elemento("button", "botao obra-detalhes", "Ver detalhes");
        botao.type = "button";
        botao.dataset.detalhesId = obra.id;
        botao.setAttribute("aria-haspopup", "dialog");
        botao.setAttribute("aria-controls", "detalhes-obra");
        botao.setAttribute("aria-label", `Ver detalhes: ${obra.titulo}`);
        acoes.append(botao);
    }
    acoes.append(criarAcaoContato(obra));
    info.append(acoes);
    return info;
}

function obterObraDestaque(obras) {
    // A primeira marcada vence; sem marca, usa a primeira da lista original.
    return obras.find(obra => obra.destaque) || obras[0];
}

function renderizarObras(obras) {
    const galeria = document.getElementById("galeria-obras");
    const status = document.getElementById("galeria-status");
    obrasPorId = new Map(obras.map(obra => [obra.id, obra]));
    const destaque = obterObraDestaque(obras);
    const ordemGaleria = obras.filter(obra => obra !== destaque);
    if (destaque) ordemGaleria.push(destaque);
    const cartoes = document.createDocumentFragment();
    for (const obra of ordemGaleria) {
        const cartao = elemento("article", "obra-card");
        cartao.dataset.obraId = obra.id;
        const figura = document.createElement("figure");
        const info = criarInformacoesObra(obra);
        cartao.setAttribute("aria-labelledby", info.querySelector("h3").id);
        figura.append(criarCarrosselObra(obra), info);
        cartao.append(figura);
        cartoes.append(cartao);
    }
    descartarCarrosseis(galeria);
    galeria.replaceChildren(cartoes);
    status.textContent = obras.length ? "" : "Nenhuma obra cadastrada no momento. Volte em breve para conhecer as pinturas.";
    status.hidden = obras.length > 0;
}

function renderizarDestaque(obras, mensagem = "Novas pinturas serão apresentadas aqui em breve.") {
    const container = document.getElementById("destaque");
    descartarCarrosseis(container);
    const obra = obterObraDestaque(obras);
    if (!obra) {
        container.replaceChildren(elemento("p", "estado-destaque", mensagem));
        return;
    }
    const figura = elemento("figure", "obra-destaque");
    figura.dataset.obraId = obra.id;
    figura.append(criarCarrosselObra(obra, { prioridade: true }), criarInformacoesObra(obra, "destaque"));
    container.replaceChildren(figura);
}

let carregamentoAtual = 0;
async function iniciarGaleria() {
    const carga = ++carregamentoAtual;
    const galeria = document.getElementById("galeria-obras");
    const destaque = document.getElementById("destaque");
    const status = document.getElementById("galeria-status");
    const tentar = document.getElementById("galeria-tentar-novamente");
    status.hidden = false;
    status.textContent = "Carregando obras…";
    tentar.hidden = true;
    galeria.setAttribute("aria-busy", "true");
    destaque.setAttribute("aria-busy", "true");
    try {
        const dados = await carregarObras();
        if (carga !== carregamentoAtual) return;
        const obras = normalizarObras(dados);
        renderizarObras(obras);
        renderizarDestaque(obras);
    } catch (erro) {
        if (carga !== carregamentoAtual) return;
        renderizarObras([]);
        renderizarDestaque([], "A obra em destaque não pôde ser carregada. Você pode tentar novamente na galeria.");
        status.hidden = false;
        status.textContent = "Não foi possível carregar as obras. Tente novamente.";
        tentar.hidden = false;
        console.error("Erro ao carregar a galeria:", JSON.stringify(erro));
    } finally {
        if (carga === carregamentoAtual) {
            galeria.setAttribute("aria-busy", "false");
            destaque.setAttribute("aria-busy", "false");
        }
    }
}

// 6. Um único dialog e um único conjunto de listeners durante toda a sessão.
function iniciarDetalhes() {
    const dialog = document.getElementById("detalhes-obra");
    const conteudo = document.getElementById("detalhes-conteudo");
    const fechar = document.getElementById("detalhes-fechar");
    let origem = null;
    let posicaoAnterior = { x: 0, y: 0 };
    let irAoContato = false;

    function abrirDetalhes(botao) {
        const obra = obrasPorId.get(botao.dataset.detalhesId);
        if (!obra || dialog.open) return;
        origem = botao;
        posicaoAnterior = { x: window.scrollX, y: window.scrollY };
        const carrosselOrigem = botao.closest(".obra-card, .obra-destaque")?.querySelector(".obra-carrossel");
        const indiceInicial = Number(carrosselOrigem?.dataset.fotoAtual) || 0;
        const fotos = elemento("div", "detalhes-fotos");
        fotos.append(criarCarrosselObra(obra, { prioridade: true, indiceInicial }));
        conteudo.replaceChildren(fotos, criarInformacoesObra(obra, "detalhes"));
        document.documentElement.style.setProperty("--pagina-topo", `${-posicaoAnterior.y}px`);
        document.documentElement.classList.add("detalhes-abertos");
        dialog.showModal();
        dialog.scrollTop = 0;
        fechar.focus({ preventScroll: true });
    }

    document.addEventListener("click", (evento) => {
        const botao = evento.target.closest("button[data-detalhes-id]");
        if (botao) abrirDetalhes(botao);
        const contato = evento.target.closest('a[href="#contato"]');
        if (contato && dialog.contains(contato)) {
            evento.preventDefault();
            irAoContato = true;
            dialog.close();
        }
    });
    fechar.addEventListener("click", () => dialog.close());
    // Além da inércia nativa, mantém Tab/Shift+Tab dentro da janela, sem
    // deslocar o foco para a interface do navegador ao chegar aos extremos.
    dialog.addEventListener("keydown", (evento) => {
        if (evento.key !== "Tab") return;
        const alvos = [...dialog.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]')]
            .filter(alvo => alvo.getClientRects().length > 0);
        const primeiro = alvos[0];
        const ultimo = alvos[alvos.length - 1];
        if (evento.shiftKey && document.activeElement === primeiro) {
            evento.preventDefault();
            ultimo.focus();
        } else if (!evento.shiftKey && document.activeElement === ultimo) {
            evento.preventDefault();
            primeiro.focus();
        }
    });
    // Escape é tratado pelo dialog nativo; ambos os caminhos passam por close.
    dialog.addEventListener("close", () => {
        descartarCarrosseis(conteudo);
        conteudo.replaceChildren();
        document.documentElement.classList.remove("detalhes-abertos");
        document.documentElement.style.removeProperty("--pagina-topo");
        window.scrollTo({ left: posicaoAnterior.x, top: posicaoAnterior.y, behavior: "instant" });
        if (origem?.isConnected) origem.focus({ preventScroll: true });
        origem = null;
        if (irAoContato) {
            irAoContato = false;
            window.location.hash = "contato";
            document.getElementById("contato").scrollIntoView({ block: "start", behavior: "instant" });
            document.getElementById("contato-titulo").focus({ preventScroll: true });
        }
    });
}

// 7. Mantém o conteúdo abaixo do cabeçalho fixo, inclusive após zoom e rotação.
function iniciarCabecalho() {
    const header = document.querySelector("header");
    const medirHeader = () => document.documentElement.style.setProperty(
        "--header-altura", `${header.getBoundingClientRect().height}px`
    );
    medirHeader();
    new ResizeObserver(medirHeader).observe(header);
}

iniciarCabecalho();
iniciarDetalhes();
renderizarContatos();
document.getElementById("galeria-tentar-novamente").addEventListener("click", iniciarGaleria);
iniciarGaleria();
