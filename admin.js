
const SUPABASE_URL = "https://pfvopboqnpeijcvawqiy.supabase.co";
const SUPABASE_CHAVE = "sb_publishable_SMyurOHpLT0dm_SAbgOWpg_Za3rdHsl" 
const ARTISTA_UID = "82adfe14-c9bd-403d-abb3-ab95beba4758";

const el = id => document.getElementById(id);

let cliente;
let obras = [];
let obraAtual = null;
let ocupado = false;
let previaLocal = null;

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

function mostrarPrevia(url) {
    if (previaLocal) {
        URL.revokeObjectURL(previaLocal);
        previaLocal = null;
    }

    const imagem = el("imagem-preview");
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
    mostrarPrevia("");
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
    mostrarPrevia(urlImagem(obra.imagem_path));
    el("obra-form").scrollIntoView({ behavior: "smooth" });
    el("titulo").focus({ preventScroll: true });
    mensagem(`Editando: ${obra.titulo}`);
}

async function listarObras() {
    const { data, error } = await cliente.from("obras")
        .select(
            "id,titulo,legenda,imagem_path,tecnica,dimensoes,preco,vendida"
        )
        .order("created_at", { ascending: false })
        .order("id", { ascending: true });

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

        detalhes.append(titulo, informacao, editar);
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

        if (error) {
            throw error;
        }

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

el("imagem").addEventListener("change", () => {
    const arquivo = el("imagem").files[0];
    mostrarPrevia(
        obraAtual ? urlImagem(obraAtual.imagem_path) : ""
    );

    if (arquivo) {
        previaLocal = URL.createObjectURL(arquivo);
        el("imagem-preview").src = previaLocal;
        el("imagem-preview").hidden = false;
    }
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

        let caminho = obraAtual?.imagem_path || "";
        const arquivo = el("imagem").files[0];

        if (arquivo) {
            const extensoes = {
                "image/jpeg": "jpg",
                "image/png": "png",
                "image/webp": "webp"
            };

            const extensao = extensoes[arquivo.type];
            if (!extensao) {
                throw new Error("Use uma foto JPG, PNG ou WebP.");
            }

            if (arquivo.size > 5 * 1024 * 1024) {
                throw new Error("A foto deve ter no máximo 5 MB.");
            }

            caminho = `${ARTISTA_UID}/${crypto.randomUUID()}.${extensao}`;

            const { error } = await cliente.storage.from("obras")
                .upload(caminho, arquivo, {
                    contentType: arquivo.type,
                    upsert: false
                });

            if (error) throw error;
        }

        if (!caminho) throw new Error("Escolha uma foto para a obra.");

        const dados = {
            titulo,
            legenda: el("legenda").value.trim(),
            tecnica: el("tecnica").value.trim(),
            dimensoes: el("dimensoes").value.trim(),
            preco,
            vendida: el("vendida").checked,
            imagem_path: caminho
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