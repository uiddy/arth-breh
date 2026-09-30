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
        legenda.textContent = obra.legenda;
        figura.append(criarImagemObra(obra), legenda);

        const titulo = document.createElement("h3");
        titulo.textContent = obra.titulo;

        const disponibilidade = document.createElement("p");
        disponibilidade.className = "obra-disponibilidade";
        disponibilidade.textContent = obra.vendida ? "Vendida" : "Disponível";
        if (obra.vendida) {
            disponibilidade.classList.add("obra-disponibilidade--vendida");
        }

        cartao.append(figura, titulo, disponibilidade);
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
