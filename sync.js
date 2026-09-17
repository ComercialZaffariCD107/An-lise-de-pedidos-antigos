// ========================================================
// ========================================================
// SINCRONIZAÇÃO AUTOMÁTICA — File System Access API
//
// Conecta a subpasta "Análise de Pedidos Antigos" (dentro da
// pasta mestre) uma única vez. A partir daí, detecta sozinho
// os 3 arquivos pelo NOME (não pela extensão, já que Pedidos
// e Master usam a mesma extensão .xlsx/.xls/.csv):
//   - arquivo cujo nome contém "pedido"   -> Pedidos
//   - arquivo cujo nome contém "master"   -> Master
//   - arquivo cujo nome contém "etiqueta" -> Etiquetas
// e reprocessa automaticamente sempre que qualquer um dos
// três for salvo/atualizado no disco.
//
// Reaproveita 100% da lógica já existente no projeto:
// carregarPedidos(file), carregarMasters(file),
// carregarEtiquetas(file), cruzarDados(...),
// atualizarDashboard(), renderTabela().
//
// IMPORTANTE: renomeie os arquivos na pasta mestre pra
// conter essas palavras-chave no nome (ex: "Pedidos_hoje.xlsx",
// "Relacao_Master.xlsx", "Consulta_Etiqueta.txt").
// ========================================================
// ========================================================

const SYNC_DB_NAME = "master-cross-analyzer-sync-db";
const SYNC_STORE_NAME = "handles";
const SYNC_HANDLE_KEY = "pastaAnalise";
const SYNC_INTERVALO_MS = 5000; // checa a cada 5s

let syncDirHandle = null;

let syncArquivoPedidosHandle = null;
let syncArquivoMasterHandle = null;
let syncArquivoEtiquetaHandle = null;

let syncLastModifiedPedidos = 0;
let syncLastModifiedMaster = 0;
let syncLastModifiedEtiqueta = 0;

let syncIntervalId = null;

// ---------- IndexedDB: persistir o handle da pasta ----------

function syncAbrirDB(){

    return new Promise((resolve, reject)=>{

        const req = indexedDB.open(SYNC_DB_NAME, 1);

        req.onupgradeneeded = ()=>
        req.result.createObjectStore(SYNC_STORE_NAME);

        req.onsuccess = ()=> resolve(req.result);

        req.onerror = ()=> reject(req.error);

    });

}

async function syncSalvarHandle(handle){

    const db = await syncAbrirDB();

    return new Promise((resolve, reject)=>{

        const tx = db.transaction(SYNC_STORE_NAME, "readwrite");

        tx.objectStore(SYNC_STORE_NAME).put(handle, SYNC_HANDLE_KEY);

        tx.oncomplete = resolve;

        tx.onerror = ()=> reject(tx.error);

    });

}

async function syncCarregarHandle(){

    const db = await syncAbrirDB();

    return new Promise((resolve, reject)=>{

        const tx = db.transaction(SYNC_STORE_NAME, "readonly");

        const req = tx.objectStore(SYNC_STORE_NAME).get(SYNC_HANDLE_KEY);

        req.onsuccess = ()=> resolve(req.result || null);

        req.onerror = ()=> reject(req.error);

    });

}

async function syncLimparHandle(){

    const db = await syncAbrirDB();

    const tx = db.transaction(SYNC_STORE_NAME, "readwrite");

    tx.objectStore(SYNC_STORE_NAME).delete(SYNC_HANDLE_KEY);

}

async function syncGarantirPermissao(handle){

    const opcoes = { mode: "read" };

    if((await handle.queryPermission(opcoes)) === "granted") return true;

    if((await handle.requestPermission(opcoes)) === "granted") return true;

    return false;

}

// ---------- UI ----------

function syncSetStatus(tipo, textoExtra){

    const el = document.getElementById("syncStatus");

    if(!el) return;

    const mapa = {

        off: [
            "sync-off",
            '<span class="sync-dot"></span> Sincronização desligada'
        ],

        scan: [
            "sync-scan",
            '<span class="sync-dot"></span> Procurando arquivos na pasta...'
        ],

        on: [
            "sync-on",
            '<span class="sync-dot"></span> Conectado — monitorando' +
            (textoExtra ? ` (${textoExtra})` : "")
        ]

    };

    el.className = mapa[tipo][0];
    el.innerHTML = mapa[tipo][1];

    const btnConectar = document.getElementById("btnConectarPasta");
    const btnDesconectar = document.getElementById("btnDesconectarPasta");

    if(btnConectar) btnConectar.style.display = tipo === "off" ? "inline-block" : "none";
    if(btnDesconectar) btnDesconectar.style.display = tipo === "off" ? "none" : "inline-block";

}

function syncAtualizarUltimaChecagem(){

    const el = document.getElementById("syncUltimaChecagem");

    if(!el) return;

    el.style.display = "inline";

    el.textContent =
    "Última checagem: " +
    new Date().toLocaleTimeString("pt-BR");

}

// ---------- Varredura da subpasta ----------
// Detecção por PALAVRA-CHAVE no nome do arquivo (não por
// extensão, já que Pedidos e Master usam a mesma extensão).

const SYNC_PALAVRA_PEDIDOS = "pedido";
const SYNC_PALAVRA_MASTER = "master";
const SYNC_PALAVRA_ETIQUETA = "etiqueta";

const SYNC_EXT_VALIDAS = [".xlsx",".xls",".csv",".txt"];

function syncTemExtensaoValida(nome){

    const n = nome.toLowerCase();

    return SYNC_EXT_VALIDAS.some(ext=> n.endsWith(ext));

}

async function syncVarrerPasta(){

    syncSetStatus("scan");

    syncArquivoPedidosHandle = null;
    syncArquivoMasterHandle = null;
    syncArquivoEtiquetaHandle = null;

    for await (const [nome, handle] of syncDirHandle.entries()){

        if(handle.kind !== "file") continue;

        if(!syncTemExtensaoValida(nome)) continue;

        const nomeLower = nome.toLowerCase();

        if(
            !syncArquivoPedidosHandle &&
            nomeLower.includes(SYNC_PALAVRA_PEDIDOS)
        ){

            syncArquivoPedidosHandle = handle;

        }else if(
            !syncArquivoMasterHandle &&
            nomeLower.includes(SYNC_PALAVRA_MASTER)
        ){

            syncArquivoMasterHandle = handle;

        }else if(
            !syncArquivoEtiquetaHandle &&
            nomeLower.includes(SYNC_PALAVRA_ETIQUETA)
        ){

            syncArquivoEtiquetaHandle = handle;

        }

    }

    const faltando = [];

    if(!syncArquivoPedidosHandle) faltando.push('"pedido" (arquivo de Pedidos)');
    if(!syncArquivoMasterHandle) faltando.push('"master" (Relação de Masters)');
    if(!syncArquivoEtiquetaHandle) faltando.push('"etiqueta" (Consulta Situação Etiquetas)');

    if(faltando.length){

        alert(
            "Não encontrei na pasta um arquivo pra cada tipo esperado.\n\n" +
            "Faltando (renomeie o arquivo pra conter a palavra-chave):\n" +
            faltando.map(f=>"• " + f).join("\n")
        );

        return false;

    }

    return true;

}

// ---------- Processamento automático (reaproveita as funções originais) ----------

async function syncProcessarArquivos(){

    mostrarLoading();

    try{

        const pedidosFile =
        await syncArquivoPedidosHandle.getFile();

        const masterFile =
        await syncArquivoMasterHandle.getFile();

        const etiquetaFile =
        await syncArquivoEtiquetaHandle.getFile();

        const pedidos =
        await carregarPedidos(pedidosFile);

        atualizarLoading(25);

        const masters =
        await carregarMasters(masterFile);

        const etiquetas =
        await carregarEtiquetas(etiquetaFile);

        atualizarLoading(50);

        cruzarDados(pedidos, masters, etiquetas);

        atualizarLoading(75);

        atualizarDashboard();

        atualizarLoading(100);

        esconderLoading();

        if(typeof renderTabela === "function"){

            renderTabela();

        }

        // reflete nos campos de nome de arquivo da UI manual também
        document.getElementById("nomeArquivoPedidos").innerText =
        "🔗 " + pedidosFile.name + " (auto)";

        document.getElementById("nomeArquivoMaster").innerText =
        "🔗 " + masterFile.name + " (auto)";

        document.getElementById("nomeArquivoEtiqueta").innerText =
        "🔗 " + etiquetaFile.name + " (auto)";

        console.log(
            `Sincronização automática concluída: ${resultado.length} linhas`
        );

    }catch(erro){

        console.error(erro);

        esconderLoading();

    }

}

// ---------- Loop de monitoramento ----------

function syncPararMonitoramento(){

    if(syncIntervalId){

        clearInterval(syncIntervalId);

        syncIntervalId = null;

    }

}

function syncIniciarMonitoramento(){

    syncPararMonitoramento();

    const nomesDetectados = [

        syncArquivoPedidosHandle?.name,
        syncArquivoMasterHandle?.name,
        syncArquivoEtiquetaHandle?.name

    ].filter(Boolean).join(" + ");

    syncSetStatus("on", nomesDetectados);

    syncIntervalId = setInterval(
        syncChecarMudancas,
        SYNC_INTERVALO_MS
    );

}

async function syncChecarMudancas(){

    try{

        let mudou = false;

        const filePedidos =
        await syncArquivoPedidosHandle.getFile();

        if(filePedidos.lastModified !== syncLastModifiedPedidos){

            syncLastModifiedPedidos = filePedidos.lastModified;

            mudou = true;

        }

        const fileMaster =
        await syncArquivoMasterHandle.getFile();

        if(fileMaster.lastModified !== syncLastModifiedMaster){

            syncLastModifiedMaster = fileMaster.lastModified;

            mudou = true;

        }

        const fileEtiqueta =
        await syncArquivoEtiquetaHandle.getFile();

        if(fileEtiqueta.lastModified !== syncLastModifiedEtiqueta){

            syncLastModifiedEtiqueta = fileEtiqueta.lastModified;

            mudou = true;

        }

        syncAtualizarUltimaChecagem();

        if(mudou){

            await syncProcessarArquivos();

        }

    }catch(erro){

        console.error(
            "Erro ao checar mudanças na pasta:",
            erro
        );

    }

}

// ---------- Ações de UI (botões) ----------

async function conectarPastaAnalise(){

    try{

        syncDirHandle = await window.showDirectoryPicker();

        await syncSalvarHandle(syncDirHandle);

        const encontrou = await syncVarrerPasta();

        if(!encontrou){

            syncSetStatus("off");

            return;

        }

        // primeira carga imediata + marca os lastModified atuais
        await syncProcessarArquivos();

        const filePedidos = await syncArquivoPedidosHandle.getFile();
        syncLastModifiedPedidos = filePedidos.lastModified;

        const fileMaster = await syncArquivoMasterHandle.getFile();
        syncLastModifiedMaster = fileMaster.lastModified;

        const fileEtiqueta = await syncArquivoEtiquetaHandle.getFile();
        syncLastModifiedEtiqueta = fileEtiqueta.lastModified;

        syncIniciarMonitoramento();

    }catch(erro){

        if(erro.name !== "AbortError"){

            console.error(erro);

            alert("Erro ao conectar a pasta: " + erro.message);

        }

    }

}

async function desconectarPastaAnalise(){

    syncPararMonitoramento();

    syncDirHandle = null;
    syncArquivoPedidosHandle = null;
    syncArquivoMasterHandle = null;
    syncArquivoEtiquetaHandle = null;
    syncLastModifiedPedidos = 0;
    syncLastModifiedMaster = 0;
    syncLastModifiedEtiqueta = 0;

    await syncLimparHandle();

    syncSetStatus("off");

    const elChecagem = document.getElementById("syncUltimaChecagem");

    if(elChecagem) elChecagem.style.display = "none";

}

// ---------- Reconexão automática ao abrir a página ----------

(async function syncTentarReconectar(){

    const handleSalvo = await syncCarregarHandle();

    if(!handleSalvo) return;

    const temPermissao = await syncGarantirPermissao(handleSalvo);

    if(!temPermissao){

        // não força popup de permissão sem interação do usuário;
        // ele clica em "Conectar Pasta" de novo se precisar
        return;

    }

    syncDirHandle = handleSalvo;

    const encontrou = await syncVarrerPasta();

    if(!encontrou) return;

    const filePedidos = await syncArquivoPedidosHandle.getFile();
    syncLastModifiedPedidos = filePedidos.lastModified;

    const fileMaster = await syncArquivoMasterHandle.getFile();
    syncLastModifiedMaster = fileMaster.lastModified;

    const fileEtiqueta = await syncArquivoEtiquetaHandle.getFile();
    syncLastModifiedEtiqueta = fileEtiqueta.lastModified;

    await syncProcessarArquivos();

    syncIniciarMonitoramento();

})();
