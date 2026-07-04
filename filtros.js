// =====================================
// FILTROS
// =====================================

let filtroSituacaoGlobal = "";
let filtroEtiquetaGlobal = "";

function obterDadosFiltrados(){

    // Campos de texto/select — antes disparavam
    // renderTabela() mas não eram lidos aqui dentro.
    const textoLoja =
    (document.getElementById("fLoja")?.value || "")
    .toLowerCase().trim();

    const textoPedido =
    (document.getElementById("fPedido")?.value || "")
    .toLowerCase().trim();

    const textoProduto =
    (document.getElementById("fProduto")?.value || "")
    .toLowerCase().trim();

    const situacaoSelect =
    (document.getElementById("fSituacao")?.value || "")
    .trim();

    return resultado.filter(item=>{

        const passouLoja =
        !textoLoja ||
        String(item.Loja || "")
        .toLowerCase()
        .includes(textoLoja);

        const passouPedido =
        !textoPedido ||
        String(item.Pedido || "")
        .toLowerCase()
        .includes(textoPedido);

        const passouProduto =
        !textoProduto ||
        String(item.Produto || "")
        .toLowerCase()
        .includes(textoProduto) ||
        String(item.Descricao || "")
        .toLowerCase()
        .includes(textoProduto);

        const passouSituacaoSelect =
        !situacaoSelect ||
        (item.Situacao || "").trim() === situacaoSelect;

       const passouSituacao =

!filtroSituacaoGlobal ||

(item.Situacao || "")
.includes(
    filtroSituacaoGlobal
);
        const passouEtiqueta =

        !filtroEtiquetaGlobal ||

        (item.SituacaoEtiqueta || "")
        .includes(
            filtroEtiquetaGlobal
        );

        return (

            passouLoja &&
            passouPedido &&
            passouProduto &&
            passouSituacaoSelect &&

            passouSituacao &&

            passouEtiqueta

        );

    });

}

// =====================================
// TABELA
// =====================================

function renderTabela(){

    const dados =
    obterDadosFiltrados();

    const tbody =
    document.getElementById(
        "tbody"
    );

    let html = "";

    dados.slice(0,1000).forEach(item=>{

        let classe = "";

        if(
            item.Situacao ===
            "🔴 Sem Master"
        ){
            classe = "sem-master";
        }

        if(
            item.Situacao ===
            "🟠 Master Antiga"
        ){
            classe = "master-antiga";
        }

        if(
            item.Situacao ===
            "🟢 Com Master"
        ){
            classe = "com-master";
        }

        html += `

        <tr class="${classe}">
            <td>${item.Loja}</td>
            <td>${item.Pedido}</td>
            <td>${item.Produto}</td>
            <td>${item.Descricao}</td>
            <td>${item.Quantidade}</td>
            <td>${item.Master || "-"}</td>
            <td>${item.DiasMaster}</td>
            <td>${item.Situacao}</td>
            <td>${item.SituacaoEtiqueta || "-"}</td>
        </tr>

        `;

    });

    tbody.innerHTML = html;

}

// =====================================
// APLICAR FILTROS (TABELA + DASHBOARD)
// =====================================
// Ponto único chamado por qualquer gatilho de filtro
// (inputs de texto, selects, cliques nos KPIs, botão
// "Filtrar"). Antes só a tabela era atualizada; os
// gráficos e KPIs continuavam mostrando o total geral.

function aplicarFiltros(){

    renderTabela();

    if(typeof atualizarDashboard === "function"){

        atualizarDashboard();

    }

}

// =====================================
// FILTROS AUTOMÁTICOS
// =====================================

document.addEventListener(
    "DOMContentLoaded",
    ()=>{

        
        const campos = [

    "fLoja",
    "fPedido",
    "fProduto",
    "fSituacao",

];

        campos.forEach(id=>{

            document
            .getElementById(id)
            ?.addEventListener(
                "input",
                aplicarFiltros
            );

            document
            .getElementById(id)
            ?.addEventListener(
                "change",
                aplicarFiltros
            );

        });

        // Select de etiqueta não fazia nada até então —
        // agora ele escreve no mesmo filtro global usado
        // pelos KPIs clicáveis (filtrarEtiqueta).
        document
        .getElementById("fEtiqueta")
        ?.addEventListener(
            "change",
            function(){

                filtroSituacaoGlobal = "";

                filtroEtiquetaGlobal = this.value;

                aplicarFiltros();

            }
        );

    }
);


function filtrarSituacao(situacao){

    filtroEtiquetaGlobal = "";

    if(
        filtroSituacaoGlobal ===
        situacao
    ){

        filtroSituacaoGlobal = "";

    }else{

        filtroSituacaoGlobal =
        situacao;

    }

    aplicarFiltros();

}

function filtrarEtiqueta(etiqueta){

    filtroSituacaoGlobal = "";

    if(
        filtroEtiquetaGlobal ===
        etiqueta
    ){

        filtroEtiquetaGlobal = "";

    }else{

        filtroEtiquetaGlobal =
        etiqueta;

    }

    aplicarFiltros();

}
