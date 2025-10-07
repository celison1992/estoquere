// Lógica Principal da Aplicação (script.js)
// Este script lida com todas as interações de front-end, validações e comunicação com o Firebase.
// Inclui correção para salvamento de produto, cálculo de margem e listagem em tempo real.

// ====================================================================
// Variáveis Globais (Definidas em firebase-config.js e utilizadas aqui)
// As instâncias 'db' e 'auth', e '__app_id' são populadas por 'firebase-config.js'
// As funções do Firebase (collection, addDoc, onSnapshot, etc.) são importadas lá
// ====================================================================

// Funções utilitárias de formatação
const formatCurrency = (value) => {
    return `R$ ${parseFloat(value).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
};

// ====================================================================
// UTILS: Validação de CPF e CNPJ
// ====================================================================

const isValidCPF = (cpf) => {
    if (!cpf) return false;
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let sum, rest;
    sum = 0;
    for (let i = 1; i <= 9; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
    rest = (sum * 10) % 11;
    if ((rest === 10) || (rest === 11)) rest = 0;
    if (rest !== parseInt(cpf.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
    rest = (sum * 10) % 11;
    if ((rest === 10) || (rest === 11)) rest = 0;
    return rest === parseInt(cpf.substring(10, 11));
};

const isValidCNPJ = (cnpj) => {
    if (!cnpj) return false;
    cnpj = cnpj.replace(/[^\d]+/g, '');
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpj)) return false;

    let size = cnpj.length - 2;
    let numbers = cnpj.substring(0, size);
    let digits = cnpj.substring(size);
    let sum = 0;
    let pos = size - 7;
    for (let i = size; i >= 1; i--) {
        sum += numbers.charAt(size - i) * pos--;
        if (pos < 2) pos = 9;
    }
    let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== parseInt(digits.charAt(0))) return false;

    size = size + 1;
    numbers = cnpj.substring(0, size);
    sum = 0;
    pos = size - 7;
    for (let i = size; i >= 1; i--) {
        sum += numbers.charAt(size - i) * pos--;
        if (pos < 2) pos = 9;
    }
    result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    return result === parseInt(digits.charAt(1));
};

// ====================================================================
// FUNÇÕES DE EXIBIÇÃO DE MENSAGENS
// ====================================================================

const displayMessage = (message, type = 'success', containerId = 'messageBox') => {
    const container = document.getElementById(containerId);
    if (!container) return;

    let bgColor, textColor;
    switch (type) {
        case 'error':
            bgColor = 'bg-red-100';
            textColor = 'text-red-700';
            break;
        case 'warning':
            bgColor = 'bg-yellow-100';
            textColor = 'text-yellow-700';
            break;
        case 'info':
            bgColor = 'bg-blue-100';
            textColor = 'text-blue-700';
            break;
        case 'success':
        default:
            bgColor = 'bg-green-100';
            textColor = 'text-green-700';
            break;
    }

    // Nota: O containerId é 'messageBox' para cadastro-produto e perfil, mas 'messageBoxProdutos'
    // para a lista de produtos. O ajuste na chamada deve ser feito no código que chama displayMessage.
    
    container.className = `mt-4 p-3 rounded-lg text-center ${bgColor} ${textColor} font-medium block`;
    container.textContent = message;
    container.classList.remove('hidden');

    setTimeout(() => {
        container.classList.add('hidden');
    }, 5000);
};

// ====================================================================
// LÓGICA DE CADASTRO DE PRODUTO (cadastro-produto.html)
// ====================================================================

// Simulação de Dados de Endereço (Para Dropdowns no perfil.html)
const statesData = {
    'SP': ['São Paulo', 'Campinas', 'Guarulhos'],
    'RJ': ['Rio de Janeiro', 'Niterói', 'Duque de Caxias'],
    'MG': ['Belo Horizonte', 'Uberlândia', 'Contagem'],
    'PR': ['Curitiba', 'Londrina', 'Maringá'],
    // ... adicione mais estados e cidades conforme necessário
};

function setupCalculoPreco() {
    const custoInput = document.getElementById('custo');
    const margemInput = document.getElementById('margemLucro');
    const precoVendaInput = document.getElementById('precoVenda');

    if (!custoInput || !margemInput || !precoVendaInput) {
        console.warn("Erro: Um ou mais campos (custo, margemLucro, precoVenda) não foram encontrados no HTML.");
        return;
    }

    const calculatePrice = () => {
        // Usa .replace(',', '.') para garantir que parseFloat entenda o formato brasileiro
        let custo = parseFloat(custoInput.value.replace(',', '.')) || 0;
        let margem = parseFloat(margemInput.value.replace(',', '.')) || 0;

        if (custo < 0 || margem < 0) {
            precoVendaInput.value = '0,00';
            displayMessage("Custo e Margem devem ser valores positivos.", 'warning', 'messageBox');
            return;
        }

        // Fórmula: Preço de Venda = Custo * (1 + Margem/100)
        let precoVenda = custo * (1 + margem / 100);

        precoVendaInput.value = precoVenda.toFixed(2).replace('.', ',');
        // Remove a mensagem se o cálculo for bem-sucedido
        document.getElementById('messageBox')?.classList.add('hidden');
    };

    // Adiciona event listeners para cálculo em tempo real
    custoInput.addEventListener('input', calculatePrice);
    margemInput.addEventListener('input', calculatePrice);

    // Garante que o cálculo seja feito na primeira carga (caso haja valores pré-preenchidos)
    calculatePrice();
}

// ====================================================================
// LÓGICA DE SALVAMENTO DE PRODUTO NO FIRESTORE
// ====================================================================

function handleCadastroProduto(event) {
    event.preventDefault();

    // Verifica se o Firebase e o usuário estão disponíveis
    if (typeof db === 'undefined' || typeof auth === 'undefined' || !auth.currentUser) {
        displayMessage("Erro: O Firebase não está inicializado ou o usuário não está autenticado.", 'error', 'messageBox');
        return;
    }
    
    // Obtém a referência de funções do Firebase (assumindo que são globais após a importação)
    const { collection, addDoc } = window; // Assumindo que as funções foram importadas para o escopo global

    const userId = auth.currentUser.uid;
    const form = event.target;

    const precoVendaValue = form.precoVenda.value;
    // Verifica se o cálculo foi feito e o campo não está vazio
    if (!precoVendaValue || precoVendaValue === '0,00') {
         displayMessage("O Preço de Venda não pode ser zero. Verifique Custo e Margem.", 'warning', 'messageBox');
         return;
    }

    const produtoData = {
        codigoBarras: form.codigoBarras.value.trim(),
        marca: form.marca.value.trim(),
        descricao: form.productDescription.value.trim(),
        custo: parseFloat(form.custo.value.replace(',', '.')) || 0,
        margemLucro: parseFloat(form.margemLucro.value.replace(',', '.')) || 0,
        precoVenda: parseFloat(precoVendaValue.replace(',', '.')) || 0,
        quantidade: parseInt(form.productQuantity.value, 10) || 0,
        createdAt: new Date(),
    };

    // Define o caminho da coleção privada para o usuário
    const productCollection = collection(db, `artifacts/${__app_id}/users/${userId}/products`);

    addDoc(productCollection, produtoData)
        .then(() => {
            displayMessage(`Produto "${produtoData.descricao}" salvo com sucesso!`, 'success', 'messageBox');
            form.reset();
            // Garante que os campos de cálculo voltem ao valor inicial
            document.getElementById('precoVenda').value = '0,00';
            document.getElementById('custo').value = '0,00';
            document.getElementById('margemLucro').value = '30';
        })
        .catch((error) => {
            console.error("Erro ao salvar o produto:", error);
            displayMessage("Erro ao salvar: " + error.message, 'error', 'messageBox');
        });
}

// ====================================================================
// LÓGICA DE PERFIL DA LOJA (perfil.html)
// ====================================================================

// 1. Lógica para carregar Estados e Cidades
function setupAddressDropdowns() {
    const stateSelect = document.getElementById('estadoSelect');
    const citySelect = document.getElementById('cidadeSelect');

    if (!stateSelect || !citySelect) return;

    // Preencher Estados
    Object.keys(statesData).forEach(uf => {
        const option = document.createElement('option');
        option.value = uf;
        option.textContent = uf;
        stateSelect.appendChild(option);
    });

    // Função para filtrar Cidades
    const updateCities = () => {
        const selectedState = stateSelect.value;
        citySelect.innerHTML = '<option value="">Selecione a Cidade</option>';
        if (selectedState && statesData[selectedState]) {
            statesData[selectedState].forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                citySelect.appendChild(option);
            });
        }
    };

    stateSelect.addEventListener('change', updateCities);
    updateCities(); // Inicializa as cidades
}

// 2. Lógica para Achar Localização Atual (Geolocalização)
function setupGeolocation() {
    const locateButton = document.getElementById('locateButton');
    if (!locateButton) return;

    locateButton.addEventListener('click', () => {
        locateButton.textContent = 'Buscando...';
        locateButton.disabled = true;

        if (!navigator.geolocation) {
            displayMessage('Geolocalização não é suportada pelo seu navegador.', 'error', 'messageBoxPerfil');
            locateButton.textContent = 'Achar Localização Atual';
            locateButton.disabled = false;
            return;
        }

        navigator.geolocation.getCurrentPosition((position) => {
            // SIMULAÇÃO: Converte (latitude, longitude) para Endereço
            const simulatedAddress = {
                street: 'Rua das Flores',
                number: '123',
                neighborhood: 'Jardim Primavera',
                city: 'São Paulo', // Cidade que deve existir no statesData
                stateUF: 'SP' // Estado que deve existir no statesData
            };

            // Preenche os campos do formulário
            document.getElementById('rua').value = simulatedAddress.street;
            document.getElementById('numero').value = simulatedAddress.number;
            document.getElementById('bairro').value = simulatedAddress.neighborhood;
            document.getElementById('estadoSelect').value = simulatedAddress.stateUF;
            
            // Força a atualização da lista de cidades e seleciona a cidade simulada
            const stateSelect = document.getElementById('estadoSelect');
            stateSelect.dispatchEvent(new Event('change'));
            setTimeout(() => { // Pequeno delay para garantir que a cidade apareça no dropdown
                document.getElementById('cidadeSelect').value = simulatedAddress.city;
            }, 100);

            displayMessage('Localização encontrada e preenchida!', 'success', 'messageBoxPerfil');
            locateButton.textContent = 'Localização Encontrada';
            locateButton.disabled = false;

        }, (error) => {
            console.error("Erro de Geolocalização:", error);
            displayMessage('Erro ao obter a localização. Verifique as permissões.', 'error', 'messageBoxPerfil');
            locateButton.textContent = 'Achar Localização Atual';
            locateButton.disabled = false;
        });
    });
}

// 3. Lógica para Validação de Documento (CPF/CNPJ) e Envio
function handlePerfilSubmit(event) {
    event.preventDefault();

    const { doc, setDoc } = window; // Assumindo que as funções foram importadas para o escopo global

    const form = event.target;
    const documento = form.documento.value.replace(/[^\d]+/g, '');
    const docType = documento.length === 11 ? 'CPF' : (documento.length === 14 ? 'CNPJ' : null);

    const docErrorElement = document.getElementById('documentoError');
    // Verifica se o elemento de erro existe antes de tentar manipulá-lo
    if (docErrorElement) {
        docErrorElement.textContent = '';
    } else {
        console.warn("Elemento #documentoError não encontrado.");
    }
    
    // Validação de CPF/CNPJ
    if (docType === 'CPF' && !isValidCPF(documento)) {
        if (docErrorElement) docErrorElement.textContent = 'CPF inválido.';
        return;
    }
    if (docType === 'CNPJ' && !isValidCNPJ(documento)) {
        if (docErrorElement) docErrorElement.textContent = 'CNPJ inválido.';
        return;
    }
    if (!docType) {
        if (docErrorElement) docErrorElement.textContent = 'Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos.';
        return;
    }
    
    // Processo de Salvamento no Firebase (Salva dados privados do perfil)
    if (typeof db === 'undefined' || typeof auth === 'undefined' || !auth.currentUser) {
        displayMessage("Erro: O Firebase não está inicializado ou o usuário não está autenticado.", 'error', 'messageBoxPerfil');
        return;
    }

    const userId = auth.currentUser.uid;
    // Caminho do documento: /artifacts/{appId}/users/{userId}/private/profile
    const userDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/private/profile`);

    const perfilData = {
        nomeLoja: form.nomeLoja.value.trim(),
        documento: documento,
        docType: docType,
        telefone: form.telefone.value.trim(),
        email: form.email.value.trim(),
        endereco: {
            estado: form.estadoSelect.value,
            cidade: form.cidadeSelect.value,
            rua: form.rua.value.trim(),
            numero: form.numero.value.trim(),
            bairro: form.bairro.value.trim(),
        },
        // logoUrl: 'URL_DO_LOGO_APÓS_UPLOAD', // Adicionar lógica de upload
        updatedAt: new Date()
    };

    setDoc(userDocRef, perfilData, { merge: true })
        .then(() => {
            displayMessage("Perfil da loja salvo com sucesso!", 'success', 'messageBoxPerfil');
        })
        .catch((error) => {
            console.error("Erro ao salvar o perfil:", error);
            displayMessage("Erro ao salvar o perfil: " + error.message, 'error', 'messageBoxPerfil');
        });
}

// ====================================================================
// LÓGICA DE PRODUTOS CADASTRADOS (produtos.html)
// ====================================================================

/**
 * Esta função é chamada PELO firebase-config.js APÓS o usuário ser autenticado.
 * Ela configura o listener de tempo real para a listagem de produtos.
 */
function setupProdutosPage() {
    if (typeof db === 'undefined' || typeof auth === 'undefined' || !auth.currentUser) {
        console.warn("Aguardando Firebase ou autenticação...");
        return;
    }

    const { collection, onSnapshot } = window; // Assumindo que as funções foram importadas para o escopo global

    const userId = auth.currentUser.uid;
    const tableBody = document.getElementById('produtosTableBody');
    if (!tableBody) return;

    // Define o ID do container de mensagens para a página de produtos
    const messageContainerId = 'messageBoxProdutos'; 

    const productsCollection = collection(db, `artifacts/${__app_id}/users/${userId}/products`);
    
    // Listener em tempo real (onSnapshot)
    onSnapshot(productsCollection, (snapshot) => {
        tableBody.innerHTML = ''; // Limpa a tabela
        
        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="7" class="py-4 text-center text-gray-500">Nenhum produto cadastrado ainda.</td></tr>';
            return;
        }

        // Ordenação manual dos dados (evitando problemas com orderBy no Firestore)
        const products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        
        // Exemplo de ordenação (ex: por data de criação)
        products.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));

        products.forEach(data => {
            const row = tableBody.insertRow();
            row.className = 'border-b hover:bg-gray-50 transition duration-150';

            row.insertCell().textContent = data.codigoBarras || 'N/A';
            row.insertCell().textContent = data.marca || '';
            row.insertCell().textContent = data.descricao || '';
            row.insertCell().textContent = data.quantidade || 0;
            row.insertCell().textContent = formatCurrency(data.custo);
            row.insertCell().textContent = formatCurrency(data.precoVenda);
            
            // Célula de Ações
            const actionCell = row.insertCell();
            actionCell.className = 'text-right';
            const editButton = document.createElement('button');
            editButton.textContent = 'Editar';
            editButton.className = 'text-blue-600 hover:text-blue-800 text-sm font-medium mr-2';
            editButton.onclick = () => console.log('Editar produto:', data.id);

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Excluir';
            deleteButton.className = 'text-red-600 hover:text-red-800 text-sm font-medium';
            deleteButton.onclick = () => handleDeleteProduto(data.id, data.descricao, messageContainerId);
            
            actionCell.appendChild(editButton);
            actionCell.appendChild(deleteButton);
        });

    }, (error) => {
        console.error("Erro ao buscar produtos:", error);
        tableBody.innerHTML = '<tr><td colspan="7" class="py-4 text-center text-red-500">Erro ao carregar dados.</td></tr>';
    });
}

// 5. Lógica de Exclusão de Produto
function handleDeleteProduto(docId, descricao, messageContainerId) {
    
    // IMPORTANTE: Substituir o window.confirm por um modal UI personalizado em ambiente de produção.
    if (!window.confirm(`Tem certeza que deseja excluir o produto "${descricao}"?`)) return; 

    const { doc, deleteDoc } = window; // Assumindo que as funções foram importadas para o escopo global

    const userId = auth.currentUser.uid;
    const docRef = doc(db, `artifacts/${__app_id}/users/${userId}/products/${docId}`);

    deleteDoc(docRef)
        .then(() => {
            displayMessage(`Produto "${descricao}" excluído com sucesso!`, 'success', messageContainerId);
        })
        .catch((error) => {
            console.error("Erro ao excluir o produto:", error);
            displayMessage("Erro ao excluir o produto: " + error.message, 'error', messageContainerId);
        });
}


// ====================================================================
// SETUP INICIAL E LISTENERS
// ====================================================================

window.onload = function() {
    // Verifica a URL para saber em qual página estamos e inicializa a lógica específica
    const path = window.location.pathname.split('/').pop();

    // 1. Lógica para Cadastro de Produto
    if (path === 'cadastro-produto.html') {
        setupCalculoPreco();
        const form = document.getElementById('cadastroForm');
        if (form) {
            form.addEventListener('submit', handleCadastroProduto);
            // Simulação de inicialização do QuaggaJS (scanner)
            // Esta linha deve ser substituída pela inicialização real do QuaggaJS, se necessário.
            const barcodeResult = document.getElementById('barcode-result');
            if(barcodeResult) {
                barcodeResult.textContent = 'Scanner de Código de Barras ativo (Simulado).';
            }
        }
    } 
    // 2. Lógica para Perfil da Loja
    else if (path === 'perfil.html') {
        setupAddressDropdowns(); // Carrega estados/cidades
        setupGeolocation(); // Adiciona o listener para o botão de localização
        const form = document.getElementById('perfilForm');
        if (form) {
            form.addEventListener('submit', handlePerfilSubmit);
        }
    } 
    // 3. Lógica para Produtos Cadastrados
    else if (path === 'produtos.html') {
        console.log("Página de Produtos Carregada. A busca de dados será iniciada após a autenticação (via firebase-config.js).");
        // A função setupProdutosPage será chamada pelo firebase-config.js
    }
};
