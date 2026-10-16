const SUPABASE_URL = "https://pfvopboqnpeijcvawqiy.supabase.co";
const SUPABASE_CHAVE = "sb_publishable_SMyurOHpLT0dm_SAbgOWpg_Za3rdHsl";
const ARTISTA_UID = "82adfe14-c9bd-403d-abb3-ab95beba4758";

const el = id => document.getElementById(id);
const CAMPOS_FOTOS = [
    { id: "imagem", campo: "imagem_path", nome: "frente" },
    { id: "imagem-verso", campo: "imagem_verso_path", nome: "verso" },
    { id: "imagem-textura", campo: "imagem_textura_path", nome: "textura" }
];

let cliente;
let obras = [];
let obraAtual = null;
let ocupado = false;
let fotosExtrasDisponiveis = false;
const previasLocais = new Map();

function mensagem(texto) {
    el("status").textContent = texto;
}

function mostrarErro(erro) {
    console.error("Erro no painel:", erro);
    mensagem(erro.message || "Ocorreu um erro. Tente novamente.");
}

function bloquear(valor) {
    ocupado = valor;
    document.querySelectorAll("input, textarea, button").forEach(item => {
        item.disabled = valor;
    });
}

function urlImagem(caminho) {
    if (!caminho) return "";
    return cliente.storage.from("obras")
        .getPublicUrl(caminho).data.publicUrl;
}

function mostrarPrevia(id, url) {
    if (previasLocais.has(id)) {
        URL.revokeObjectURL(previasLocais.get(id));
        previasLocais.delete(id);
    }

    const imagem = el(`${id}-preview`);
    imagem.hidden = !url;

    if (url) imagem.src = url;
    else imagem.removeAttribute("src");
}

function limparFormulario() {
    obraAtual = null;
    el("obra-form").reset();
    el("form-titulo").textContent = "Adicionar obra";
    el("salvar").textContent = "Salvar obra";
    el("imagem").required = true;
    el("cancelar").hidden = true;
    CAMPOS_FOTOS.forEach(({ id }) => mostrarPrevia(id, ""));
}

function mostrarLogin() {
    el("login-secao").hidden = false;
    el("painel-secao").hidden = true;
    el("lista-obras").replaceChildren();
    obras = [];
    limparFormulario();
}

async function verificarAcesso() {
    const { data, error } = await cliente.auth.getUser();

    if (error || !data.user) {
        mostrarLogin();
        throw new Error("Entre novamente para continuar.");
    }

    if (data.user.id !== ARTISTA_UID) {
        mostrarLogin();
        throw new Error("Esta conta não tem acesso ao painel.");
    }

    return data.user;
}

function editarObra(obra) {
    if (ocupado) return;

    limparFormulario();
    obraAtual = obra;

    ["titulo", "legenda", "tecnica", "dimensoes", "preco"]
        .forEach(campo => {
            el(campo).value = obra[campo] ?? "";
        });

    el("vendida").checked = obra.vendida;
    el("imagem").required = false;
    el("cancelar").hidden = false;
    el("form-titulo").textContent = "Editar obra";
    el("salvar").textContent = "Salvar alterações";
    CAMPOS_FOTOS.forEach(({ id, campo }) => {
        mostrarPrevia(id, urlImagem(obra[campo]));
    });
    el("obra-form").scrollIntoView({ behavior: "smooth" });
    el("titulo").focus({ preventScroll: true });
    mensagem(`Editando: ${obra.titulo}`);
}

async function excluirObra(obra) {
    if (ocupado) return;

    const confirmou = window.confirm(
        `Excluir a obra "${obra.titulo}"? Essa ação não pode ser desfeita. As fotos continuarão no armazenamento.`
    );

    if (!confirmou) return;

    bloquear(true);
    mensagem("Excluindo obra…");
    let excluiu = false;

    try {
        await verificarAcesso();

        const { error } = await cliente.from("obras")
            .delete()
            .eq("id", obra.id)
            .select("id")
            .single();

        if (error) throw error;

        excluiu = true;

        if (obraAtual?.id === obra.id) {
            limparFormulario();
        }

        await listarObras();
        mensagem("Obra excluída! Atualize a galeria para ver a mudança.");
    } catch (erro) {
        if (excluiu) {
            mensagem("A obra foi excluída, mas a lista não atualizou. Recarregue o painel.");
        } else {
            mostrarErro(erro);
        }
    } finally {
        bloquear(false);
    }
}

async function listarObras() {
    const campos = "id,titulo,legenda,imagem_path,tecnica,dimensoes,preco,vendida";
    const consultar = selecao => cliente.from("obras")
        .select(selecao)
        .order("created_at", { ascending: false })
        .order("id", { ascending: true });

    let { data, error } = await consultar(`${campos},imagem_verso_path,imagem_textura_path`);
    fotosExtrasDisponiveis = !error;

    // Mantém as obras acessíveis enquanto a migração das fotos não foi aplicada.
    if (error && ["42703", "PGRST204"].includes(error.code)
        && /imagem_(verso|textura)_path/.test(error.message)) {
        ({ data, error } = await consultar(campos));
    }

    if (error) throw error;

    obras = data ?? [];
    const lista = el("lista-obras");
    lista.replaceChildren();

    if (!obras.length) {
        const aviso = document.createElement("p");
        aviso.textContent = "Nenhuma obra cadastrada ainda.";
        lista.append(aviso);
        return;
    }

    obras.forEach(obra => {
        const card = document.createElement("article");
        card.className = "obra-card";

        const imagem = document.createElement("img");
        imagem.src = urlImagem(obra.imagem_path);
        imagem.alt = obra.titulo;
        imagem.loading = "lazy";

        const detalhes = document.createElement("div");

        const titulo = document.createElement("h3");
        titulo.textContent = obra.titulo;

        const informacao = document.createElement("p");

        const preco = obra.preco === null
            ? "Preço sob consulta"
            : new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL"
            }).format(obra.preco);

        informacao.textContent =
            `${obra.vendida ? "Vendida" : "Disponível"} · ${preco}`;

        const editar = document.createElement("button");
        editar.type = "button";
        editar.textContent = "Editar obra";
        editar.addEventListener("click", () => editarObra(obra));

        const excluir = document.createElement("button");
        excluir.type = "button";
        excluir.textContent = "Excluir obra";
        excluir.setAttribute("aria-label", `Excluir obra: ${obra.titulo}`);
        excluir.addEventListener("click", () => excluirObra(obra));

        const acoes = document.createElement("div");
        acoes.className = "obra-acoes";
        acoes.append(editar, excluir);

        detalhes.append(titulo, informacao, acoes);
        card.append(imagem, detalhes);
        lista.append(card);
    });
}

async function abrirPainel() {
    await verificarAcesso();
    el("login-secao").hidden = true;
    el("painel-secao").hidden = false;
    limparFormulario();
    await listarObras();
    mensagem("Você entrou. O painel está pronto.");
}

el("login-form").addEventListener("submit", async evento => {
    evento.preventDefault();
    if (ocupado) return;

    bloquear(true);
    mensagem("Entrando…");

    try {
        const { error } = await cliente.auth.signInWithPassword({
            email: el("email").value.trim(),
            password: el("senha").value
        });

        if (error) throw error;

        el("senha").value = "";
        await abrirPainel();
    } catch (erro) {
        mostrarErro(erro);
    } finally {
        bloquear(false);
    }
});

el("sair").addEventListener("click", async () => {
    if (ocupado) return;
    bloquear(true);

    try {
        const { error } = await cliente.auth.signOut();
        if (error) throw error;

        mostrarLogin();
        mensagem("Você saiu do painel.");
    } catch (erro) {
        mostrarErro(erro);
    } finally {
        bloquear(false);
    }
});

el("nova-obra").addEventListener("click", () => {
    limparFormulario();
    el("titulo").focus();
    mensagem("Preencha os dados da nova obra.");
});

el("cancelar").addEventListener("click", () => {
    limparFormulario();
    mensagem("Edição cancelada.");
});

CAMPOS_FOTOS.forEach(({ id, campo }) => {
    el(id).addEventListener("change", () => {
        const arquivo = el(id).files[0];
        mostrarPrevia(id, urlImagem(obraAtual?.[campo]));

        if (arquivo) {
            const previa = URL.createObjectURL(arquivo);
            previasLocais.set(id, previa);
            el(`${id}-preview`).src = previa;
            el(`${id}-preview`).hidden = false;
        }
    });
});

el("obra-form").addEventListener("submit", async evento => {
    evento.preventDefault();
    if (ocupado) return;

    bloquear(true);
    mensagem("Salvando obra…");
    let salvou = false;

    try {
        await verificarAcesso();

        const titulo = el("titulo").value.trim();
        if (!titulo) throw new Error("Preencha o título.");

        const valor = el("preco").value;
        const preco = valor === "" ? null : Number(valor);

        if (preco !== null && (!Number.isFinite(preco) || preco < 0)) {
            throw new Error("Informe um preço válido.");
        }

        const extensoes = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp"
        };
        const fotos = CAMPOS_FOTOS.map(foto => ({
            ...foto,
            arquivo: el(foto.id).files[0],
            caminho: obraAtual?.[foto.campo] || null
        }));

        if (!fotos[0].arquivo && !fotos[0].caminho) {
            throw new Error("Escolha uma foto da frente da obra.");
        }

        if (!fotosExtrasDisponiveis && fotos.slice(1).some(foto => foto.arquivo)) {
            throw new Error("O envio de fotos do verso e da textura ainda precisa ser habilitado no painel. Após a configuração, recarregue a página e tente novamente.");
        }

        // Valida todas as fotos antes de iniciar qualquer envio.
        for (const { arquivo, nome } of fotos) {
            if (!arquivo) continue;
            const extensao = extensoes[arquivo.type];

            if (!extensao) {
                throw new Error(`A foto de ${nome} deve estar em JPG, PNG ou WebP.`);
            }

            if (arquivo.size > 5 * 1024 * 1024) {
                throw new Error(`A foto de ${nome} deve ter no máximo 5 MB.`);
            }
        }

        const caminhos = {};

        for (const { arquivo, campo, caminho } of fotos) {
            // Não envia colunas novas ao banco antes da migração.
            if (campo !== "imagem_path" && !fotosExtrasDisponiveis) continue;
            caminhos[campo] = caminho;
            if (!arquivo) continue;

            const novoCaminho = `${ARTISTA_UID}/${crypto.randomUUID()}.${extensoes[arquivo.type]}`;

            const { error } = await cliente.storage.from("obras")
                .upload(novoCaminho, arquivo, {
                    contentType: arquivo.type,
                    upsert: false
                });

            if (error) throw error;
            caminhos[campo] = novoCaminho;
        }

        const dados = {
            titulo,
            legenda: el("legenda").value.trim(),
            tecnica: el("tecnica").value.trim(),
            dimensoes: el("dimensoes").value.trim(),
            preco,
            vendida: el("vendida").checked,
            ...caminhos
        };

        const consulta = obraAtual
            ? cliente.from("obras").update(dados).eq("id", obraAtual.id)
            : cliente.from("obras").insert(dados);

        const { error } = await consulta.select("id").single();
        if (error) throw error;

        salvou = true;
        limparFormulario();
        await listarObras();
        mensagem("Obra salva! Atualize a galeria para ver a mudança.");
    } catch (erro) {
        if (salvou) {
            mensagem("A obra foi salva, mas a lista não atualizou. Recarregue o painel.");
        } else {
            mostrarErro(erro);
        }
    } finally {
        bloquear(false);
    }
});

async function iniciar() {
    bloquear(true);

    try {
        if (!window.supabase) {
            throw new Error("A biblioteca do Supabase não carregou.");
        }

        if (SUPABASE_CHAVE === "COLE_SUA_CHAVE_PUBLICAVEL") {
            throw new Error("Preencha a chave publicável no admin.js.");
        }

        cliente = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_CHAVE
        );

        const { data, error } = await cliente.auth.getSession();
        if (error) throw error;

        if (data.session) {
            await abrirPainel();
        } else {
            mostrarLogin();
            mensagem("Entre com sua conta para gerenciar as obras.");
        }
    } catch (erro) {
        mostrarErro(erro);
    } finally {
        bloquear(false);
    }
}

iniciar();
