// Importações do Firebase (Certifique-se de que este arquivo existe e tem as suas chaves)
import { produtosRef, addDoc } from "./firebase-config.js"; 

// =========================================================
// FUNÇÕES AUXILIARES
// =========================================================

/**
 * Gera um identificador interno único para o produto.
 */
function gerarIdentificadorInterno(codigoBarras) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    // Exemplo de formato: CELI-8A6B-1L2Z9
    return `CELI-${randomPart}-${timestamp.substring(4, 9)}`; 
}

/**
 * Calcula o preço de venda com base no custo e na margem de lucro.
 * Fórmula: Preço Venda = Custo / (1 - (Margem / 100))
 */
function calcularPrecoVenda() {
    const custoInput = document.getElementById('custo');
    const margemInput = document.getElementById('margemLucro');
    const precoVendaInput = document.getElementById('precoVenda');

    const custo = parseFloat(custoInput.value);
    const margem = parseFloat(margemInput.value);

    if (custo > 0 && margem >= 0) {
        const fator = 1 - (margem / 100);
        if (fator > 0) {
            const precoVenda = custo / fator;
            precoVendaInput.value = precoVenda.toFixed(2);
        } else {
            precoVendaInput.value = "Margem 100% ou mais!";
        }
    } else {
        precoVendaInput.value = "0.00";
    }
}

// =========================================================
// LÓGICA DO SCANNER (QUAGGAJS)
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
    // 1. Inicializa o Scanner QuaggaJS
    Quagga.init({
        inputStream : {
            name : "Live",
            type : "LiveStream",
            target: document.querySelector('#interactive'), // O elemento HTML onde a câmera aparece
            constraints: {
                facingMode: "environment" // Força o uso da câmera traseira no celular
            },
        },
        decoder : {
            readers : ["ean_reader", "upc_reader", "code_128_reader"] // Tipos de código mais comuns
        },
        locate: true, // Desenha um box ao redor do código detectado
    }, function(err) {
        if (err) {
            console.error("Erro ao iniciar o QuaggaJS: ", err);
            document.getElementById('barcode-result').textContent = "Erro ao carregar a câmera. Verifique as permissões.";
            return
        }
        Quagga.start();
        console.log("Scanner QuaggaJS iniciado.");
    });

    // 2. Evento de Detecção Bem-Sucedida
    Quagga.onDetected(function(result) {
        const codigo = result.codeResult.code;
        
        // Se a leitura for válida e o campo estiver vazio (evita leituras múltiplas desnecessárias)
        if (codigo && !document.getElementById('codigoBarras').value) {
            
            // Preenche os campos
            document.getElementById('codigoBarras').value = codigo;
            document.getElementById('identificadorInterno').value = gerarIdentificadorInterno(codigo);
            document.getElementById('barcode-result').textContent = `Código de Barras Lido: ${codigo}`;
            
            // Para o scanner após a primeira leitura
            Quagga.stop(); 
            
            // Oculta a área do scanner (opcional, para focar no preenchimento)
            document.getElementById('scanner-container').style.display = 'none';
        }
    });

    // =========================================================
    // LÓGICA DO FORMULÁRIO E FIREBASE
    // =========================================================

    // 1. Event Listener para cálculo em tempo real
    const form = document.getElementById('cadastro-form');
    form.addEventListener('input', calcularPrecoVenda);
    calcularPrecoVenda(); // Chamada inicial para preencher o campo com '0.00'

    // 2. Event Listener para submissão e gravação no Firebase
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const statusDiv = document.getElementById('mensagem-status');
        
        try {
            const novoProduto = {
                codigoBarras: form.codigoBarras.value,
                identificadorInterno: form.identificadorInterno.value,
                marca: form.marca.value,
                modelo: form.modelo.value,
                custo: parseFloat(form.custo.value),
                margemLucro: parseFloat(form.margemLucro.value),
                precoVenda: parseFloat(document.getElementById('precoVenda').value),
                dataCadastro: new Date().toISOString()
            };

            await addDoc(produtosRef, novoProduto); // Adiciona ao Firestore
            
            statusDiv.textContent = "✅ Produto cadastrado com sucesso!";
            statusDiv.style.color = "green";

            // Limpa e reinicia o formulário para o próximo item
            form.reset(); 
            calcularPrecoVenda(); // Reseta o preço de venda sugerido

            // Volta a ligar o scanner para o próximo produto
            document.getElementById('scanner-container').style.display = 'block';
            Quagga.start();
            
        } catch (error) {
            console.error("Erro ao adicionar documento: ", error);
            statusDiv.textContent = `❌ Erro ao cadastrar: ${error.message}`;
            statusDiv.style.color = "red";
        }
    });
});
