// =====================================
// LOADING
// =====================================

function mostrarLoading(){

    document
    .getElementById(
        "loadingBox"
    )
    .style.display =
    "block";

    atualizarLoading(0);

}

function esconderLoading(){

    setTimeout(()=>{

        document
        .getElementById(
            "loadingBox"
        )
        .style.display =
        "none";

    },500);

}

function atualizarLoading(valor){

    document
    .getElementById(
        "loadingFill"
    )
    .style.width =
    valor + "%";

    document
    .getElementById(
        "loadingPercent"
    )
    .innerText =
    valor + "%";

}



// =====================================
// CONFIGURAÇÕES
// =====================================

const CONFIG = {

    DIAS_MASTER_ANTIGA: 15,

    AUTO_FILTRAR: true

};

// =====================================
// ORDENAÇÕES
// =====================================

function ordenarPorPedidoMaisAntigo(){

    resultado.sort((a,b)=>{

        const dataA =
        new Date(a.DataPedido);

        const dataB =
        new Date(b.DataPedido);

        return dataA - dataB;

    });

    renderTabela();

}

function ordenarPorLoja(){

    resultado.sort((a,b)=>{

        return String(a.Loja)
        .localeCompare(
            String(b.Loja)
        );

    });

    renderTabela();

}

function ordenarPorProduto(){

    resultado.sort((a,b)=>{

        return String(a.Produto)
        .localeCompare(
            String(b.Produto)
        );

    });

    renderTabela();

}

// =====================================
// TOP PEDIDOS ANTIGOS
// =====================================

function obterPedidosMaisAntigos(){

    return [...resultado]

    .sort((a,b)=>{

        const dataA =
        new Date(a.DataPedido);

        const dataB =
        new Date(b.DataPedido);

        return dataA - dataB;

    })

    .slice(0,20);

}

// =====================================
// TOP LOJAS IMPACTADAS
// =====================================

function obterTopLojas(){

    const mapa = {};

    resultado.forEach(item=>{

        if(!mapa[item.Loja]){

            mapa[item.Loja]=0;

        }

        mapa[item.Loja]++;

    });

    return Object.entries(mapa)

    .map(item=>({

        loja:item[0],

        ocorrencias:item[1]

    }))

    .sort(
        (a,b)=>
        b.ocorrencias -
        a.ocorrencias
    );

}

// =====================================
// TOP PRODUTOS IMPACTADOS
// =====================================

function obterTopProdutos(){

    const mapa = {};

    resultado.forEach(item=>{

        if(!mapa[item.Produto]){

            mapa[item.Produto]=0;

        }

        mapa[item.Produto]++;

    });

    return Object.entries(mapa)

    .map(item=>({

        produto:item[0],

        ocorrencias:item[1]

    }))

    .sort(
        (a,b)=>
        b.ocorrencias -
        a.ocorrencias
    );

}

// =====================================
// ALERTAS
// =====================================

function gerarAlertas(){

    const semMaster =
    resultado.filter(

        x=>
        x.Situacao ===
        "🔴 Sem Master"

    ).length;

    const masterAntiga =
    resultado.filter(

        x=>
        x.Situacao ===
        "🟠 Master Antiga"

    ).length;

    let mensagens=[];

    if(semMaster>0){

        mensagens.push(

            `🔴 ${semMaster} itens sem Master`

        );

    }

    if(masterAntiga>0){

        mensagens.push(

            `🟠 ${masterAntiga} Masters antigas`

        );

    }

    return mensagens;

}

// =====================================
// PAINEL DE ALERTAS
// =====================================

function exibirAlertas(){

    const alertas =
    gerarAlertas();

    console.log(
        "ALERTAS",
        alertas
    );

}

// =====================================
// RESUMO EXECUTIVO
// =====================================

function gerarResumoExecutivo(){

    const kpis =
    calcularKPIs();

    return {

        totalPedidos:
        kpis.total,

        semMaster:
        kpis.semMaster,

        comMaster:
        kpis.comMaster,

        masterAntiga:
        kpis.masterAntiga,

        lojas:
        kpis.lojas,

        produtos:
        kpis.produtos,

        topLojas:
        obterTopLojas()
        .slice(0,10),

        topProdutos:
        obterTopProdutos()
        .slice(0,10)

    };

}

// =====================================
// APÓS PROCESSAMENTO
// =====================================

function posProcessamento(){

    exibirAlertas();

    console.log(

        "TOP LOJAS",

        obterTopLojas()

    );

    console.log(

        "TOP PRODUTOS",

        obterTopProdutos()

    );

    console.log(

        "PEDIDOS ANTIGOS",

        obterPedidosMaisAntigos()

    );

}


// =====================================
// LOADING NOS UPLOADS
// =====================================
// Cada card de upload agora mostra uma barra de progresso
// enquanto o arquivo é lido do disco, em vez de só trocar
// o texto pra "✅ nome.xlsx" instantaneamente. O arquivo
// ainda é relido de verdade dentro de processar() — essa
// leitura aqui é só feedback visual de que o navegador
// está de fato pegando o arquivo (útil em arquivos grandes
// ou notebooks mais lentos).

function configurarUploadComLoading(inputId, nomeId, barraId, fillId){

    const input =
    document.getElementById(inputId);

    if(!input) return;

    input.addEventListener("change", function(){

        const file = this.files[0];

        const nomeEl =
        document.getElementById(nomeId);

        const barra =
        document.getElementById(barraId);

        const fill =
        document.getElementById(fillId);

        if(!file){

            nomeEl.innerHTML =
            "Nenhum arquivo carregado";

            return;

        }

        nomeEl.innerHTML =
        "⏳ Carregando " + file.name + "...";

        barra.style.display = "block";
        fill.style.width = "0%";

        const reader = new FileReader();

        reader.onprogress = function(e){

            if(e.lengthComputable){

                const pct =
                Math.round((e.loaded / e.total) * 100);

                fill.style.width = pct + "%";

            }

        };

        reader.onload = function(){

            fill.style.width = "100%";

            setTimeout(()=>{

                barra.style.display = "none";

                nomeEl.innerHTML =
                "✅ " + file.name;

            }, 250);

        };

        reader.onerror = function(){

            barra.style.display = "none";

            nomeEl.innerHTML =
            "❌ Erro ao ler " + file.name;

        };

        reader.readAsArrayBuffer(file);

    });

}

configurarUploadComLoading(
    "arquivoPedidos",
    "nomeArquivoPedidos",
    "loadingPedidos",
    "loadingFillPedidos"
);

configurarUploadComLoading(
    "arquivoMaster",
    "nomeArquivoMaster",
    "loadingMaster",
    "loadingFillMaster"
);

configurarUploadComLoading(
    "arquivoEtiqueta",
    "nomeArquivoEtiqueta",
    "loadingEtiqueta",
    "loadingFillEtiqueta"
);


// =====================================
// TEMA CLARO / ESCURO
// =====================================

function alternarTema(){

    document.body.classList.toggle(
        "tema-escuro"
    );

    const escuro =
    document.body.classList.contains(
        "tema-escuro"
    );

    document.getElementById(
        "btnTema"
    ).innerHTML = escuro
    ? "☀️ Tema Claro"
    : "🌙 Tema Escuro";

    localStorage.setItem(
        "tema",
        escuro ? "escuro" : "claro"
    );

}

// Carregar tema salvo

window.addEventListener("load",()=>{

    const tema =
    localStorage.getItem("tema");

    if(tema==="escuro"){

        document.body.classList.add(
            "tema-escuro"
        );

        document.getElementById(
            "btnTema"
        ).innerHTML =
        "☀️ Tema Claro";

    }

});
