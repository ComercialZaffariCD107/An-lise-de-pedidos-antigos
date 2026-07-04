// =====================================
// RESULTADO GLOBAL
// =====================================

let resultado = [];

// =====================================
// PROCESSAMENTO PRINCIPAL
// =====================================

async function processar(){

    try{

        mostrarLoading();
        
        const pedidosFile =
        document.getElementById(
            "arquivoPedidos"
        ).files[0];

        const masterFile =
        document.getElementById(
            "arquivoMaster"
        ).files[0];

const etiquetaFile =
document.getElementById(
    "arquivoEtiqueta"
).files[0];
        
     if(
    !pedidosFile ||
    !masterFile ||
    !etiquetaFile
){
         
alert(
    "Selecione os três arquivos."
);

            return;

        }

        const pedidos =
        await carregarPedidos(
            pedidosFile
        );

        atualizarLoading(25);
        
        const masters =
        await carregarMasters(
            masterFile
        );
        
const etiquetas =
await carregarEtiquetas(
    etiquetaFile
);
        atualizarLoading(50);
        
        cruzarDados(
    pedidos,
    masters,
    etiquetas
);

        atualizarLoading(75);
        
    // console.log(
//     "RESULTADO",
//     resultado
// );

        atualizarDashboard();
        atualizarLoading(100);
        esconderLoading();

        if(
            typeof renderTabela ===
            "function"
        ){
            renderTabela();
        }

        console.log(
    `Cruzamento concluído:
    ${resultado.length}`
);

console.log(
    "Pedidos:",
    pedidos.length
);

console.log(
    "Masters:",
    masters.length
);

console.log(
    "Etiquetas:",
    etiquetas.length
);
        
console.log(
    "Resultado:",
    resultado.length
);
    }catch(err){

        console.error(err);

        alert(
            "Erro ao processar."
        );

    }

}

// =====================================
// CRUZAMENTO
// =====================================

function cruzarDados(
    pedidos,
    masters,
    etiquetas
){

    resultado = [];

    const mapaMasters =
    new Map();

    masters.forEach(m=>{

        const chave =
        `${m.loja}|${m.produto}`;

        mapaMasters.set(
            chave,
            m
        );

    });

const mapaEtiquetasMaster =
new Map();

const mapaEtiquetasProduto =
new Map();

etiquetas.forEach(e=>{

    if(e.etiquetaMaster){

        mapaEtiquetasMaster.set(
            e.etiquetaMaster,
            e.situacaoEtiqueta
        );

    }

    if(e.produto){

        mapaEtiquetasProduto.set(
            e.produto,
            e.situacaoEtiqueta
        );

    }

});
    
    pedidos.forEach(p=>{

        const chave =
        `${p.loja}|${p.produto}`;

        const master =
        mapaMasters.get(
            chave
        );

        let situacao =
        "";

        let diasMaster =
        0;

        let codigoMaster =
        "";

        let statusMaster =
        "";

        let localizacao =
        "";

let situacaoEtiqueta =
"";
        
   if(!master){

    situacao =
    "🔴 Sem Master";

    situacaoEtiqueta =
    mapaEtiquetasProduto.get(
        p.produto
    ) || "";

}else{

    diasMaster =
    master.diasSeparacao;

    codigoMaster =
    master.master;

    if(codigoMaster){

        situacaoEtiqueta =
        mapaEtiquetasMaster.get(
            codigoMaster
        ) || "";

    }else{

        situacaoEtiqueta =
        mapaEtiquetasProduto.get(
            p.produto
        ) || "";

    }

    statusMaster =
    master.status;

    localizacao =
    master.localizacao;
            if(
                diasMaster >= 10
            ){

                situacao =
                "🟠 Master Antiga";

            }else{

                situacao =
                "🟢 Com Master";

            }

        }

     resultado.push({

    Loja:
    p.loja,

    Pedido:
    p.pedido,

    Produto:
    p.produto,

    Descricao:
    p.descricao,

    Quantidade:
    p.quantidade,

    DataPedido:
    p.dataPedido,

    StatusPedido:
    p.statusPedido,

    StatusCarga:
    p.statusCarga,

   Carga:
p.carga,

Descarga:
p.descCarga,

DataGeracaoCarga:
p.dataGeracaoCarga,

    Master:
    codigoMaster,

    DiasMaster:
    diasMaster,

    StatusMaster:
    statusMaster,

    SituacaoEtiqueta:
    situacaoEtiqueta,

    Localizacao:
    localizacao,

    Situacao:
    situacao

});
    });

}
        
// =====================================
// KPIs
// =====================================

function calcularKPIs(){

   const semMaster =
resultado.filter(
    x=>(x.Situacao || "").includes(
        "Sem Master"
    )
).length;

const comMaster =
resultado.filter(
    x=>(x.Situacao || "").includes(
        "Com Master"
    )
).length;

const masterAntiga =
resultado.filter(
    x=>(x.Situacao || "").includes(
        "Master Antiga"
    )
).length;

    const lojas =
    new Set(
        resultado.map(
            x=>x.Loja
        )
    ).size;

    const produtos =
    new Set(
        resultado.map(
            x=>x.Produto
        )
    ).size;

    return {

        total:
        resultado.length,

        semMaster,

        comMaster,

        masterAntiga,

        lojas,

        produtos

    };

}
