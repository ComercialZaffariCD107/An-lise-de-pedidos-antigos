// =====================================
// DASHBOARD
// =====================================

let graficoStatus = null;
let graficoLojas = null;
let graficoEtiquetas = null;

// Paleta alinhada com o style.css (tokens do tema industrial)
const CORES = {
    amber: "#F2A93B",
    green: "#3DCB82",
    red:   "#E8564F",
    blue:  "#4C8FD1",
    muted: "#8B97A3",
    text:  "#E7ECF1"
};

// Registra o plugin de data labels (mostra os valores
// direto nas fatias/barras, sem precisar passar o mouse)
if(typeof ChartDataLabels !== "undefined"){
    Chart.register(ChartDataLabels);
}

// Ajustes globais de leitura no fundo escuro
Chart.defaults.color = CORES.muted;
Chart.defaults.borderColor = "rgba(255,255,255,.06)";
Chart.defaults.font.family = "'Inter', 'Segoe UI', sans-serif";


// =====================================
// DASHBOARD PRINCIPAL
// =====================================

function atualizarDashboard(){

    // Respeita os filtros ativos (texto, selects e os
    // atalhos de clique nos KPIs). Sem nenhum filtro
    // ativo, obterDadosFiltrados() devolve tudo — então
    // o comportamento padrão não muda.
    const dados =
    typeof obterDadosFiltrados === "function"
    ? obterDadosFiltrados()
    : resultado;

    document.getElementById("kpiTotal").innerText =
    dados.length;

    document.getElementById("kpiSemMaster").innerText =
    dados.filter(
        x=>x.Situacao==="🔴 Sem Master"
    ).length;

    document.getElementById("kpiComMaster").innerText =
    dados.filter(
        x=>x.Situacao==="🟢 Com Master"
    ).length;

    document.getElementById("kpiMasterAntiga").innerText =
    dados.filter(
        x=>x.Situacao==="🟠 Master Antiga"
    ).length;

    document.getElementById("kpiLojas").innerText =
    new Set(dados.map(x=>x.Loja)).size;

    document.getElementById("kpiProdutos").innerText =
    new Set(dados.map(x=>x.Produto)).size;

    document.getElementById("kpiAguardando").innerText =
    dados.filter(
        x=>(x.SituacaoEtiqueta || "")
        .includes("Aguardando")
    ).length;

    document.getElementById("kpiMontagem").innerText =
    dados.filter(
        x=>(x.StatusMaster || "")
        .includes("Em Montagem")
    ).length;

    document.getElementById("kpiMontadas").innerText =
    dados.filter(
        x=>(x.SituacaoEtiqueta || "")
        .includes("Montada")
    ).length;

    document.getElementById("kpiNaoChecada").innerText =
    dados.filter(
        x=>(x.SituacaoEtiqueta || "")
        .includes("Não Checada")
    ).length;

    document.getElementById("kpiCanceladas").innerText =
    dados.filter(
        x=>(x.SituacaoEtiqueta || "")
        .includes("Cancelada")
    ).length;

    atualizarGraficoStatus(dados);
    atualizarGraficoLojas(dados);
    atualizarGraficoEtiquetas(dados);
}


// =====================================
// GRAFICO STATUS
// =====================================
// Antes era um doughnut. Como "Sem Master" costuma
// dominar (às vezes >95% dos casos), a fatia vermelha
// engolia visualmente as outras duas categorias, que
// ficavam praticamente ilegíveis no gráfico. Uma barra
// horizontal com o valor escrito ao lado de cada barra
// comunica a proporção real mesmo quando os números são
// muito desbalanceados.

function atualizarGraficoStatus(dados = resultado){

    const ctx =
    document.getElementById("graficoStatus");

    if(!ctx) return;

    if(graficoStatus)
        graficoStatus.destroy();

    const dadosGrafico = [
        { label:"Sem Master",    valor:dados.filter(x=>x.Situacao==="🔴 Sem Master").length,    cor:CORES.red },
        { label:"Com Master",    valor:dados.filter(x=>x.Situacao==="🟢 Com Master").length,    cor:CORES.green },
        { label:"Master Antiga", valor:dados.filter(x=>x.Situacao==="🟠 Master Antiga").length, cor:CORES.amber }
    ]
    .sort((a,b)=>b.valor - a.valor);

    const total =
    dadosGrafico.reduce((s,x)=>s+x.valor,0) || 1;

    graficoStatus = new Chart(ctx,{

        type:"bar",

        data:{
            labels: dadosGrafico.map(x=>x.label),

            datasets:[{
                data: dadosGrafico.map(x=>x.valor),
                backgroundColor: dadosGrafico.map(x=>x.cor),
                borderRadius:4,
                barThickness:34
            }]
        },

        options:{

            indexAxis:"y",

            plugins:{

                legend:{ display:false },

                datalabels:{
                    color: CORES.text,
                    anchor:"end",
                    align:"end",
                    font:{ weight:700 },
                    formatter:(valor)=>
                        `${valor} (${Math.round(valor/total*100)}%)`
                }

            },

            scales:{
                x:{ beginAtZero:true, grace:"15%" }
            }

        }

    });

}


// =====================================
// GRAFICO LOJAS
// =====================================
// Corrigido: o dataset não tinha "label", por isso a
// legenda mostrava "undefined". Como é um gráfico de
// série única com categorias no eixo X, a legenda não
// agrega nada — removida. Adicionado o valor exato no
// topo de cada barra.

function atualizarGraficoLojas(dados = resultado){

    const ctx =
    document.getElementById("graficoLojas");

    if(!ctx) return;

    const mapa = {};

    dados.forEach(item=>{

        mapa[item.Loja] =
        (mapa[item.Loja] || 0) + 1;

    });

    const ranking =
    Object.entries(mapa)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,10);

    if(graficoLojas)
        graficoLojas.destroy();

    graficoLojas = new Chart(ctx,{

        type:"bar",

        data:{
            labels: ranking.map(x=>x[0]),

            datasets:[{
                label:"Pedidos por loja",
                data: ranking.map(x=>x[1]),
                backgroundColor: CORES.blue,
                borderRadius:4
            }]
        },

        options:{

            plugins:{

                legend:{ display:false },

                datalabels:{
                    color: CORES.text,
                    anchor:"end",
                    align:"top",
                    font:{ weight:700 }
                }

            },

            scales:{
                y:{ beginAtZero:true, grace:"12%" }
            }

        }

    });

}


// =====================================
// GRAFICO ETIQUETAS
// =====================================
// Mantido como doughnut (as 5 categorias têm proporções
// mais equilibradas, então o formato funciona bem aqui),
// mas agora com o percentual escrito direto em cada fatia
// em vez de depender só da legenda/tooltip.

function atualizarGraficoEtiquetas(dados = resultado){

    const ctx =
    document.getElementById("graficoEtiquetas");

    if(!ctx) return;

    if(graficoEtiquetas)
        graficoEtiquetas.destroy();

    const valores = [
        dados.filter(x=>(x.SituacaoEtiqueta || "").includes("Aguardando")).length,
        dados.filter(x=>(x.StatusMaster || "").includes("Em Montagem")).length,
        dados.filter(x=>(x.SituacaoEtiqueta || "").includes("Montada")).length,
        dados.filter(x=>(x.SituacaoEtiqueta || "").includes("Não Checada")).length,
        dados.filter(x=>(x.SituacaoEtiqueta || "").includes("Cancelada")).length
    ];

    const total =
    valores.reduce((s,v)=>s+v,0) || 1;

    graficoEtiquetas = new Chart(ctx,{

        type:"doughnut",

        data:{

            labels:[
                "Aguardando",
                "Em Montagem",
                "Montadas",
                "Não Checada",
                "Cancelada"
            ],

            datasets:[{

                data: valores,

                backgroundColor:[
                    CORES.amber,
                    CORES.blue,
                    CORES.green,
                    CORES.muted,
                    CORES.red
                ],

                borderColor:"#14181C",
                borderWidth:2

            }]
        },

        options:{

            plugins:{

                legend:{
                    position:"bottom",
                    labels:{ color: CORES.muted }
                },

                datalabels:{
                    color:"#14181C",
                    font:{ weight:700, size:12 },
                    formatter:(valor)=>{

                        if(valor === 0) return "";

                        return `${Math.round(valor/total*100)}%`;

                    }
                }

            }

        }

    });

}
