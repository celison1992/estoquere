// script.js

// NÃO USAMOS imports do Firebase aqui. O 'db' e 'auth' são acessados
// globalmente (via window.db e window.auth) ou diretamente pelo objeto 'firebase'.

function isFirebaseReady() {
    // Verifica se as variáveis globais foram definidas em firebase-config.js
    return typeof db !== 'undefined' && typeof auth !== 'undefined';
}

// Exporta a função para que firebase-config.js possa chamá-la após a autenticação
export function setupCadastroProduto(user) { 
    const form = document.getElementById('cadastroForm');
    const custoInput = document.getElementById('custoInput');
    const margemInput = document.getElementById('margemInput');
    const precoVendaInput = document.getElementById('precoVendaInput');

    function calcularPrecoVenda() {
        const custo = parseFloat(custoInput.value) || 0;
        const margem = parseFloat(margemInput.value) || 0;
        const venda = custo + (custo * margem / 100);
        precoVendaInput.value = venda.toFixed(2);
    }

    // Inicializa o cálculo na abertura, já que setupCadastroProduto é chamado após DOMContentLoaded
    calcularPrecoVenda(); 
    custoInput.addEventListener('input', calcularPrecoVenda);
    margemInput.addEventListener('input', calcularPrecoVenda);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!isFirebaseReady() || !user) { 
            alert("Erro: O Firebase não está inicializado ou o usuário não está autenticado.");
            return;
        }

        const codigo = document.getElementById('codigoBarras').value;
        const marca = document.getElementById('marca').value;
        const modelo = document.getElementById('modelo').value;
        const custo = parseFloat(custoInput.value);
        const margem = parseFloat(margemInput.value);
        const venda = parseFloat(precoVendaInput.value);
        const quantidade = parseInt(document.getElementById('productQuantity').value);

        try {
            console.log("Salvando produto...");
            
            // OPERAÇÃO DE SALVAMENTO: Usando a sintaxe global (v8-compat) do Firestore
            const docRef = await firebase.firestore().collection('produtos').add({ 
                codigo,
                marca,
                modelo,
                custo,
                margem,
                venda,
                quantidade,
                criadoPor: user.uid, 
                criadoEm: new Date()
            });
            
            console.log("Produto salvo com ID:", docRef.id);

            const box = document.getElementById('messageBox');
            box.textContent = '✅ Produto cadastrado com sucesso!';
            box.classList.remove('hidden', 'bg-red-100', 'text-red-700');
            box.classList.add('bg-green-100', 'text-green-700');
            form.reset();
            precoVendaInput.value = '0.00';
            calcularPrecoVenda();
        } catch (error) {
            console.error("Erro ao salvar produto:", error);
            const box = document.getElementById('messageBox');
            box.textContent = '❌ Erro ao salvar produto. (Verifique o console e as regras do Firebase!)';
            box.classList.remove('hidden', 'bg-green-100', 'text-green-700');
            box.classList.add('bg-red-100', 'text-red-700');
        }
    });
}

// Configuração da Página de Produtos (Listagem)
window.setupProdutosPage = function () {
    const tbody = document.getElementById('productsTableBody');
    const loadingStatus = document.getElementById('loadingStatus');

    // LISTAGEM: Usando a sintaxe global (v8-compat) do Firestore
    const produtosQuery = firebase.firestore().collection('produtos').orderBy('criadoEm', 'desc');

    produtosQuery.onSnapshot((snapshot) => {
        tbody.innerHTML = '';

        if (snapshot.empty) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-gray-500 italic">
                        Nenhum produto cadastrado ainda.
                    </td>
                </tr>
            `;
            return;
        }

        snapshot.forEach(doc => {
            const p = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 font-mono text-sm">${p.codigo}</td>
                <td class="px-6 py-4">${p.modelo}</td>
                <td class="px-6 py-4">${p.marca}</td>
                <td class="px-6 py-4 text-right text-red-600 font-semibold">R$ ${p.custo.toFixed(2)}</td>
                <td class="px-6 py-4 text-right text-green-700 font-bold">R$ ${p.venda.toFixed(2)}</td>
                <td class="px-6 py-4 text-center">${p.quantidade}</td>
            `;
            tbody.appendChild(row);
        });

        loadingStatus.textContent = `Total de produtos: ${snapshot.size}`;
    });
};
