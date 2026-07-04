// =====================================
// FILTROS
// =====================================

let filtroSituacaoGlobal = "";
let filtroEtiquetaGlobal = "";

function obterDadosFiltrados(){

    return resultado.filter(item=>{

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
                renderTabela
            );

            document
            .getElementById(id)
            ?.addEventListener(
                "change",
                renderTabela
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

                renderTabela();

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

    renderTabela();

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

    renderTabela();

}
