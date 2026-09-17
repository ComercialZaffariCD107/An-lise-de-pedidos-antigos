// =====================================
// EXPORTAÇÃO EXCEL (ExcelJS)
// =====================================
// Trocado de SheetJS (xlsx) para ExcelJS porque o SheetJS
// gratuito só grava dados/fórmulas — não salva formatação
// visual. Com ExcelJS conseguimos cabeçalho colorido,
// painel congelado, largura de coluna automática, zebra
// nas linhas e cor por status, gerando um arquivo que já
// sai pronto pra abrir e ler, sem precisar formatar depois.

// =====================================
// HELPERS DE FORMATAÇÃO
// =====================================

function formatarCabecalho(chave){

    return chave

    // separa "DataPedido" -> "Data Pedido"
    .replace(/([a-z0-9])([A-Z])/g,"$1 $2")

    .replace(/_/g," ")

    .trim();

}

function estilizarCabecalho(sheet, corHex){

    const linha = sheet.getRow(1);

    linha.eachCell(cell=>{

        cell.font = {
            bold:true,
            color:{argb:"FFFFFFFF"},
            size:11
        };

        cell.fill = {
            type:"pattern",
            pattern:"solid",
            fgColor:{argb:corHex}
        };

        cell.alignment = {
            vertical:"middle",
            horizontal:"center",
            wrapText:true
        };

        cell.border = {
            bottom:{style:"thin", color:{argb:"FFD0D0D0"}}
        };

    });

    linha.height = 24;

}

function autoAjustarColunas(sheet){

    sheet.columns.forEach(col=>{

        let max =
        (col.header || "").toString().length;

        col.eachCell({includeEmpty:true}, cell=>{

            const valor =
            cell.value === null || cell.value === undefined
            ? ""
            : cell.value.toString();

            if(valor.length > max){
                max = valor.length;
            }

        });

        col.width = Math.min(Math.max(max + 3, 10), 45);

    });

}

function aplicarZebra(sheet){

    for(let i=2; i<=sheet.rowCount; i++){

        if(i % 2 === 0){

            sheet.getRow(i).eachCell({includeEmpty:true}, cell=>{

                cell.fill = {
                    type:"pattern",
                    pattern:"solid",
                    fgColor:{argb:"FFF5F7FA"}
                };

            });

        }

    }

}

// colore a linha inteira de acordo com o valor da
// coluna "Situacao" (mesma lógica de cor usada no site)
function colorirLinhasPorSituacao(sheet, chaves){

    const colIndex = chaves.indexOf("Situacao") + 1;

    if(colIndex < 1) return;

    const cores = {
        "🔴 Sem Master":    "FFFCE8E7",
        "🟢 Com Master":    "FFE8F8EF",
        "🟠 Master Antiga": "FFFDF1DD"
    };

    for(let i=2; i<=sheet.rowCount; i++){

        const row = sheet.getRow(i);

        const valor =
        row.getCell(colIndex).value;

        const cor = cores[valor];

        if(cor){

            row.eachCell({includeEmpty:true}, cell=>{

                cell.fill = {
                    type:"pattern",
                    pattern:"solid",
                    fgColor:{argb:cor}
                };

            });

        }

    }

}

// Monta uma aba de tabela genérica a partir de um array
// de objetos — as colunas são detectadas automaticamente
// pelas chaves do primeiro item, então funciona pra
// qualquer formato de "resultado" sem precisar hardcodar
// nomes de campo.
// Colunas que chegam como número serial de data do Excel
// (ex: 46204,92795) e precisam ser exibidas como data
// abreviada em vez do número cru.
const COLUNAS_DATA = [
    "DataPedido",
    "DataGeracaoCarga"
];

// Converte o serial numérico em Date real e marca a coluna
// com numFmt de data abreviada (dd/mm/aa).
function aplicarFormatoData(sheet, chaves){

    chaves.forEach((chave, idx)=>{

        if(!COLUNAS_DATA.includes(chave)) return;

        const colIndex = idx + 1;

        const coluna = sheet.getColumn(colIndex);

        coluna.numFmt = "dd/mm/yy";

        for(let i=2; i<=sheet.rowCount; i++){

            const cell = sheet.getRow(i).getCell(colIndex);

            const valor = cell.value;

            if(typeof valor === "number" && valor > 0){

                // Excel: dia 0 = 30/12/1899
                cell.value = new Date(
                    Date.UTC(1899,11,30) +
                    valor * 86400000
                );

            }

        }

    });

}

function criarAbaTabela(wb, nome, dados, corHex, opcoes = {}){

    const sheet = wb.addWorksheet(nome, {
        views:[{ state:"frozen", ySplit:1 }]
    });

    if(!dados.length){

        sheet.getCell("A1").value =
        "Nenhum dado encontrado.";

        sheet.getCell("A1").font = { italic:true };

        return sheet;

    }

    const chaves = Object.keys(dados[0]);

    sheet.columns = chaves.map(chave=>({
        header: formatarCabecalho(chave),
        key: chave
    }));

    dados.forEach(item=> sheet.addRow(item));

    estilizarCabecalho(sheet, corHex);

    aplicarFormatoData(sheet, chaves);

    autoAjustarColunas(sheet);

    aplicarZebra(sheet);

    if(opcoes.colorirPorSituacao){

        colorirLinhasPorSituacao(sheet, chaves);

    }

    sheet.autoFilter = {
        from:{ row:1, column:1 },
        to:{ row:1, column:chaves.length }
    };

    return sheet;

}

// Aba de resumo executivo — layout vertical rótulo/valor
// em vez de uma tabela de uma linha só, mais fácil de ler
// numa olhada rápida.
function criarAbaResumo(wb, resumo){

    const sheet = wb.addWorksheet("Resumo Executivo");

    sheet.getColumn(1).width = 30;
    sheet.getColumn(2).width = 16;

    sheet.mergeCells("A1:B1");

    const titulo = sheet.getCell("A1");

    titulo.value = "📊 RESUMO EXECUTIVO — ANÁLISE DE PEDIDOS ANTIGOS";

    titulo.font = {
        bold:true,
        size:13,
        color:{argb:"FFFFFFFF"}
    };

    titulo.fill = {
        type:"pattern",
        pattern:"solid",
        fgColor:{argb:"FF1D2329"}
    };

    titulo.alignment = { vertical:"middle", horizontal:"left" };

    sheet.getRow(1).height = 30;

    sheet.addRow([]);

    const linhas = [
        ["Total de Pedidos",     resumo.Total_Pedidos],
        ["Sem Master",           resumo.Sem_Master],
        ["Com Master",           resumo.Com_Master],
        ["Master Antiga",        resumo.Master_Antiga],
        ["Lojas Impactadas",     resumo.Lojas_Impactadas],
        ["Produtos Impactados",  resumo.Produtos_Impactados]
    ];

    const coresDestaque = {
        "Sem Master":    "FFE8564F",
        "Com Master":    "FF3DCB82",
        "Master Antiga": "FFF2A93B"
    };

    linhas.forEach(([label, valor])=>{

        const row = sheet.addRow([label, valor]);

        row.getCell(1).font = { bold:true, size:11 };

        const cor = coresDestaque[label];

        row.getCell(2).font = {
            bold:true,
            size:13,
            color:{argb: cor ? "FFFFFFFF" : "FF1B2126"}
        };

        row.getCell(2).alignment = { horizontal:"right" };

        if(cor){

            row.getCell(2).fill = {
                type:"pattern",
                pattern:"solid",
                fgColor:{argb:cor}
            };

        }

        row.height = 20;

    });

    sheet.addRow([]);

    const rodape = sheet.addRow([
        `Gerado em ${new Date().toLocaleString("pt-BR")}`
    ]);

    rodape.getCell(1).font = {
        italic:true,
        size:9,
        color:{argb:"FF8B97A3"}
    };

    return sheet;

}

// =====================================
// EXPORTAÇÃO PRINCIPAL
// =====================================

async function exportarExcel(){

    // Respeita o filtro ativo na tela (situação/etiqueta).
    // Se nenhum filtro estiver ativo, obterDadosFiltrados()
    // retorna o resultado completo normalmente.
    const dadosBase =
    typeof obterDadosFiltrados === "function"
    ? obterDadosFiltrados()
    : resultado;

    const filtroAtivo =
    (typeof filtroSituacaoGlobal !== "undefined" && filtroSituacaoGlobal) ||
    (typeof filtroEtiquetaGlobal !== "undefined" && filtroEtiquetaGlobal);

    if(!dadosBase.length){

        alert("Nenhum dado para exportar.");

        return;

    }

    const wb = new ExcelJS.Workbook();

    wb.creator = "Análise de Pedidos Antigos";
    wb.created = new Date();

    // =====================================
    // RESULTADO COMPLETO
    // =====================================

    const resultadoExportacao =
    dadosBase.map(item=>({

        ...item,

        StatusFinal:
        item.Master
        ? item.StatusMaster
        : "Sem Master"

    }));

    criarAbaTabela(
        wb,
        "Resultado",
        resultadoExportacao,
        "FF4C8FD1",
        { colorirPorSituacao:true }
    );

    // =====================================
    // SEM MASTER
    // =====================================

    const semMaster =
    dadosBase.filter(
        x => x.Situacao === "🔴 Sem Master"
    );

    criarAbaTabela(
        wb,
        "Sem Master",
        semMaster,
        "FFE8564F"
    );

    // =====================================
    // MASTER ANTIGA
    // =====================================

    const masterAntiga =
    dadosBase.filter(
        x => x.Situacao === "🟠 Master Antiga"
    );

    criarAbaTabela(
        wb,
        "Master Antiga",
        masterAntiga,
        "FFF2A93B"
    );

    // =====================================
    // RESUMO EXECUTIVO
    // =====================================

    const resumo = {

        Total_Pedidos: dadosBase.length,

        Sem_Master: semMaster.length,

        Com_Master: dadosBase.filter(
            x => x.Situacao === "🟢 Com Master"
        ).length,

        Master_Antiga: masterAntiga.length,

        Lojas_Impactadas:
        new Set(dadosBase.map(x=>x.Loja)).size,

        Produtos_Impactados:
        new Set(dadosBase.map(x=>x.Produto)).size

    };

    criarAbaResumo(wb, resumo);

    // =====================================
    // RANKING LOJAS
    // =====================================

    const mapaLojas = {};

    dadosBase.forEach(item=>{

        mapaLojas[item.Loja] =
        (mapaLojas[item.Loja] || 0) + 1;

    });

    const rankingLojas =

    Object.entries(mapaLojas)

    .map(([loja, qtd])=>({ Loja:loja, Ocorrencias:qtd }))

    .sort((a,b)=> b.Ocorrencias - a.Ocorrencias)

    .map((item, i)=>({ Posicao:i+1, ...item }));

    criarAbaTabela(
        wb,
        "Ranking Lojas",
        rankingLojas,
        "FF9B84D6"
    );

    // =====================================
    // RANKING PRODUTOS
    // =====================================

    const mapaProdutos = {};

    dadosBase.forEach(item=>{

        mapaProdutos[item.Produto] =
        (mapaProdutos[item.Produto] || 0) + 1;

    });

    const rankingProdutos =

    Object.entries(mapaProdutos)

    .map(([produto, qtd])=>({ Produto:produto, Ocorrencias:qtd }))

    .sort((a,b)=> b.Ocorrencias - a.Ocorrencias)

    .map((item, i)=>({ Posicao:i+1, ...item }));

    criarAbaTabela(
        wb,
        "Ranking Produtos",
        rankingProdutos,
        "FF4FB8C7"
    );

    // =====================================
    // DOWNLOAD
    // =====================================

    const buffer = await wb.xlsx.writeBuffer();

    const blob = new Blob(
        [buffer],
        { type:"application/octet-stream" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download =
    `MASTER_CROSS_${
        filtroAtivo ? "FILTRADO_" : ""
    }${
        new Date().toISOString().slice(0,10)
    }.xlsx`;

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(url);

}
