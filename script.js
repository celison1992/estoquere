// Lógica Principal da Aplicação (script.js)
// ----------------------------------------------------
// Este arquivo contém todas as funções JavaScript para dar vida às páginas
// (index.html, cadastro-produto.html, perfil.html, produtos.html),
// incluindo validações, localização, e interações com o Firebase.

// Importa funções do Firebase (configurado em firebase-config.js)
// Assumimos que o firebase-config.js exporta 'db' e 'auth'
import { db, auth, getUserId, showMessage } from './firebase-config.js';
import { doc, setDoc, getDoc, collection, query, onSnapshot, orderBy, where, serverTimestamp, addDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ====================================================================
// 1. UTILITÁRIOS (VALIDAÇÃO DE DOCUMENTOS)
// ====================================================================

/**
 * Funções para validar o CPF e CNPJ.
 * Nota: Algoritmos complexos foram simplificados/omitidos para brevidade,
 * focando apenas na verificação de tamanho e formato.
 * Para uso real, deve-se usar bibliotecas de validação robustas.
 */

const VALIDATION = {
    /**
     * Verifica se o número de CPF é válido (apenas comprimento para fins de simulação).
     * @param {string} cpf O CPF a ser validado (apenas números).
     */
    isValidCPF: (cpf) => {
        if (!cpf || cpf.length !== 11) return false;
        // Simulação: em um app real, o algoritmo completo de dígitos verificadores seria aplicado aqui.
        return true; 
    },

    /**
     * Verifica se o número de CNPJ é válido (apenas comprimento para fins de simulação).
     * @param {string} cnpj O CNPJ a ser validado (apenas números).
     */
    isValidCNPJ: (cnpj) => {
        if (!cnpj || cnpj.length !== 14) return false;
        // Simulação: em um app real, o algoritmo completo de dígitos verificadores seria aplicado aqui.
        return true;
    },

    /**
     * Função principal para validar CPF ou CNPJ baseado no comprimento.
     * @param {string} documento O documento a ser validado (apenas números).
     */
    isValidDocumento: (documento) => {
        const docLimpo = documento.replace(/[^\d]/g, '');
        if (docLimpo.length === 11) {
            return VALIDATION.isValidCPF(docLimpo);
        }
        if (docLimpo.length === 14) {
            return VALIDATION.isValidCNPJ(docLimpo);
        }
        return false;
    }
};

// ====================================================================
// 2. FUNÇÕES COMUNS DE UI
// ====================================================================

/**
 * Simula a exibição de uma mensagem de feedback no contêiner 'messageBox'.
 * @param {string} message A mensagem a ser exibida.
 * @param {string} type O tipo de mensagem ('success', 'error', 'info').
 */
const displayMessage = (message, type = 'info') => {
    const messageBox = document.getElementById('messageBox');
    if (!messageBox) return;

    let bgColor, textColor;
    switch (type) {
        case 'success':
            bgColor = 'bg-green-100';
            textColor = 'text-green-800';
            break;
        case 'error':
            bgColor = 'bg-red-100';
            textColor = 'text-red-800';
            break;
        case 'info':
        default:
            bgColor = 'bg-blue-100';
            textColor = 'text-blue-800';
            break;
    }

    messageBox.className = `mt-4 p-4 rounded-lg text-center ${bgColor} ${textColor}`;
    messageBox.textContent = message;
    messageBox.classList.remove('hidden');

    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 5000);
};

// ====================================================================
// 3. LÓGICA DE ENDEREÇO (CARREGAMENTO DE DROPDOWNS E GEOLOCALIZAÇÃO)
// ====================================================================

// Simulação de lista de estados e cidades (para um projeto real, use uma API)
const ENDERECO_DATA = {
    "SP": ["São Paulo", "Campinas", "Guarulhos"],
    "RJ": ["Rio de Janeiro", "Niterói", "Duque de Caxias"],
    "MG": ["Belo Horizonte", "Uberlândia", "Contagem"],
    "BA": ["Salvador", "Feira de Santana", "Vitória da Conquista"]
};

/**
 * Carrega a lista de estados no dropdown.
 */
const loadStates = () => {
    const estadoSelect = document.getElementById('estado');
    if (!estadoSelect) return;

    Object.keys(ENDERECO_DATA).forEach(uf => {
        const option = document.createElement('option');
        option.value = uf;
        option.textContent = uf;
        estadoSelect.appendChild(option);
    });

    // Adiciona listener para carregar cidades ao mudar o estado
    estadoSelect.addEventListener('change', loadCities);
};

/**
 * Carrega as cidades correspondentes ao estado selecionado.
 */
const loadCities = () => {
    const estadoSelect = document.getElementById('estado');
    const cidadeSelect = document.getElementById('cidade');
    if (!estadoSelect || !cidadeSelect) return;

    const uf = estadoSelect.value;
    cidadeSelect.innerHTML = '<option value="">Selecione a Cidade</option>';
    
    if (uf) {
        cidadeSelect.disabled = false;
        ENDERECO_DATA[uf].forEach(cidade => {
            const option = document.createElement('option');
            option.value = cidade;
            option.textContent = cidade;
            cidadeSelect.appendChild(option);
        });
    } else {
        cidadeSelect.disabled = true;
    }
};

/**
 * Simula a geolocalização e o preenchimento dos campos de endereço.
 */
const handleLocateAddress = () => {
    const locateButton = document.getElementById('locateButton');
    const statusText = document.getElementById('locationStatus');

    if (!locateButton || !statusText) return;

    locateButton.addEventListener('click', () => {
        statusText.classList.remove('hidden');
        statusText.textContent = 'Buscando sua localização...';
        statusText.classList.remove('text-red-500');
        statusText.classList.add('text-blue-500');

        if (!navigator.geolocation) {
            statusText.textContent = 'Geolocalização não é suportada pelo seu navegador.';
            statusText.classList.remove('text-blue-500');
            statusText.classList.add('text-red-500');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                // Simulação de Geocodificação Reversa (Lat/Lng -> Endereço)
                statusText.textContent = 'Localização obtida. Convertendo para endereço...';

                // Em um projeto real, você faria um 'fetch' para uma API de Geocodificação (Ex: Google Maps, Nominatim)
                // Usaremos um endereço mockado para simulação.
                setTimeout(() => {
                    const mockAddress = {
                        estado: 'SP',
                        cidade: 'São Paulo',
                        rua: 'Rua das Flores',
                        numero: '1000',
                        bairro: 'Jardim Botânico'
                    };
                    
                    document.getElementById('estado').value = mockAddress.estado;
                    loadCities(); // Recarrega cidades para garantir que a cidade exista
                    document.getElementById('cidade').value = mockAddress.cidade;
                    document.getElementById('rua').value = mockAddress.rua;
                    document.getElementById('numero').value = mockAddress.numero;
                    document.getElementById('bairro').value = mockAddress.bairro;
                    
                    statusText.textContent = 'Endereço preenchido com sucesso!';
                    statusText.classList.remove('text-blue-500');
                    statusText.classList.add('text-green-500');
                }, 1500);

            },
            (error) => {
                statusText.textContent = `Erro ao obter a localização: ${error.message}`;
                statusText.classList.remove('text-blue-500');
                statusText.classList.add('text-red-500');
            }
        );
    });
};


// ====================================================================
// 4. LÓGICA DO PERFIL (perfil.html)
// ====================================================================

const setupPerfilPage = () => {
    const perfilForm = document.getElementById('perfilForm');
    if (!perfilForm) return;

    loadStates();
    handleLocateAddress();

    // Listener para pré-visualização da Logo
    const logoInput = document.getElementById('logoInput');
    const logoPreview = document.getElementById('logoPreview');
    if (logoInput) {
        logoInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                logoPreview.src = URL.createObjectURL(file);
            }
        });
    }

    // Listener para o salvamento do formulário
    perfilForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const documento = document.getElementById('documento').value;
        if (!VALIDATION.isValidDocumento(documento)) {
            displayMessage('CPF/CNPJ inválido. Verifique o formato e o número.', 'error');
            return;
        }
        
        const perfilData = {
            nomeEstabelecimento: document.getElementById('nomeEstabelecimento').value,
            nomeProprietario: document.getElementById('nomeProprietario').value,
            documento: documento,
            telefone: document.getElementById('telefone').value,
            email: document.getElementById('email').value,
            endereco: {
                estado: document.getElementById('estado').value,
                cidade: document.getElementById('cidade').value,
                rua: document.getElementById('rua').value,
                numero: document.getElementById('numero').value,
                bairro: document.getElementById('bairro').value,
            },
            // A logo precisaria ser enviada para o Firebase Storage e a URL salva aqui.
            // Para simplificar, salvaremos apenas os dados do formulário.
            ultimaAtualizacao: serverTimestamp()
        };

        try {
            const userId = getUserId(auth);
            const perfilRef = doc(db, 'artifacts', 'estoquere', 'users', userId, 'config', 'perfil');
            await setDoc(perfilRef, perfilData, { merge: true });
            displayMessage('Configurações do perfil salvas com sucesso!', 'success');
        } catch (error) {
            console.error("Erro ao salvar perfil:", error);
            displayMessage('Erro ao salvar o perfil. Tente novamente.', 'error');
        }
    });

    // TODO: Adicionar a função para carregar dados do perfil do Firebase ao iniciar
};


// ====================================================================
// 5. LÓGICA DE CADASTRO DE PRODUTO (cadastro-produto.html)
// ====================================================================

/**
 * Implementa a lógica para calcular o preço de venda em tempo real.
 */
const setupCalculoPreco = () => {
    const custoInput = document.getElementById('custoInput');
    const margemInput = document.getElementById('margemInput');
    const vendaInput = document.getElementById('precoVendaInput');

    if (!custoInput || !margemInput || !vendaInput) return;

    const calculatePrice = () => {
        const custo = parseFloat(custoInput.value) || 0;
        const margem = parseFloat(margemInput.value) || 0;

        if (custo > 0 && margem >= 0) {
            const precoVenda = custo * (1 + (margem / 100));
            // Formata para duas casas decimais
            vendaInput.value = precoVenda.toFixed(2); 
        } else {
            vendaInput.value = '0.00';
        }
    };

    custoInput.addEventListener('input', calculatePrice);
    margemInput.addEventListener('input', calculatePrice);
};


/**
 * Inicializa a lógica de Scanner (QuaggaJS) - O Quagga precisa ser importado ou carregado via script tag no HTML.
 * Por simplicidade e restrições de ambiente, apenas a função de cálculo e o salvamento serão detalhados.
 */
const setupScanner = () => {
    // TODO: Implementação real do QuaggaJS ou outra biblioteca de scanner
    // Se o QuaggaJS fosse importado, a inicialização seria assim:
    /*
    if (typeof Quagga !== 'undefined') {
        Quagga.init({ 
            // ... configuração do scanner
        }, (err) => {
            if (err) { console.log(err); return; }
            Quagga.start();
        });
        Quagga.onDetected((result) => {
            document.getElementById('codigoBarrasInput').value = result.codeResult.code;
            Quagga.stop();
        });
    } else {
        console.log('QuaggaJS não carregado. A funcionalidade de scanner está desativada.');
    }
    */
   
   // Simulação de clique no botão do scanner
   const scannerButton = document.getElementById('startScannerButton');
   if(scannerButton) {
        scannerButton.addEventListener('click', () => {
            const feedback = document.getElementById('scanner-feedback');
            feedback.textContent = 'Scanner de código de barras SIMULADO: Usando código 7891234567890';
            document.getElementById('codigoBarrasInput').value = '7891234567890';
            setTimeout(() => feedback.textContent = 'Aguardando leitura...', 3000);
        });
   }
};

/**
 * Listener para o salvamento de produtos no Firebase.
 */
const setupCadastroProduto = () => {
    setupCalculoPreco();
    setupScanner(); // Configura scanner e cálculo
    
    const cadastroForm = document.getElementById('cadastroForm');
    if (!cadastroForm) return;

    cadastroForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const produtoData = {
            codigoBarras: document.getElementById('codigoBarrasInput').value,
            nome: document.getElementById('nomeInput').value,
            marca: document.getElementById('marcaInput').value,
            custo: parseFloat(document.getElementById('custoInput').value),
            margem: parseFloat(document.getElementById('margemInput').value),
            precoVenda: parseFloat(document.getElementById('precoVendaInput').value),
            estoque: parseInt(document.getElementById('estoqueInput').value),
            dataCadastro: serverTimestamp()
        };
        
        // Simples validação de campos
        if (produtoData.custo <= 0 || produtoData.precoVenda <= 0) {
             displayMessage('Custo e Preço de Venda devem ser maiores que zero.', 'error');
             return;
        }

        try {
            const userId = getUserId(auth);
            const produtosColRef = collection(db, 'artifacts', 'estoquere', 'users', userId, 'produtos');
            await addDoc(produtosColRef, produtoData);
            displayMessage('Produto cadastrado com sucesso!', 'success');
            cadastroForm.reset();
            document.getElementById('precoVendaInput').value = '0.00'; // Reseta o cálculo
        } catch (error) {
            console.error("Erro ao cadastrar produto:", error);
            displayMessage('Erro ao cadastrar o produto. Tente novamente.', 'error');
        }
    });
};


// ====================================================================
// 6. LÓGICA DE PRODUTOS CADASTRADOS (produtos.html)
// ====================================================================

/**
 * Configura o listener do Firestore para atualizar a tabela de produtos em tempo real.
 */
const setupProdutosPage = () => {
    const produtosTableBody = document.getElementById('produtosTableBody');
    if (!produtosTableBody || !auth.currentUser) return; // Retorna se a tabela não existir ou o usuário não estiver autenticado.
    
    const userId = getUserId(auth);
    const produtosColRef = collection(db, 'artifacts', 'estoquere', 'users', userId, 'produtos');
    
    // Consulta: Ordena por data de cadastro descendente
    const q = query(produtosColRef, orderBy('dataCadastro', 'desc'));

    // onSnapshot: Escuta alterações em tempo real
    onSnapshot(q, (snapshot) => {
        produtosTableBody.innerHTML = ''; // Limpa a tabela
        
        if (snapshot.empty) {
            const row = produtosTableBody.insertRow();
            row.innerHTML = `<td colspan="7" class="py-4 text-center text-gray-500">Nenhum produto cadastrado ainda.</td>`;
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            const row = produtosTableBody.insertRow();
            
            row.className = 'border-b hover:bg-gray-50';

            // Formatação de valores
            const custoFormatado = data.custo ? `R$ ${data.custo.toFixed(2)}` : 'N/A';
            const vendaFormatada = data.precoVenda ? `R$ ${data.precoVenda.toFixed(2)}` : 'N/A';
            const dataFormatada = data.dataCadastro?.toDate().toLocaleDateString('pt-BR') || 'N/A';

            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${data.nome || 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${data.marca || 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-mono">${data.codigoBarras || 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${data.estoque || 0}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-red-600">${custoFormatado}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">${vendaFormatada}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">${dataFormatada}</td>
            `;
            
            // TODO: Adicionar botões de Editar/Excluir
        });
    });
};


// ====================================================================
// 7. INICIALIZAÇÃO GERAL
// ====================================================================

/**
 * Roteamento e inicialização das funções específicas de cada página.
 */
window.onload = () => {
    // Verifica a URL para saber qual página inicializar.
    const path = window.location.pathname.split('/').pop();

    switch (path) {
        case 'perfil.html':
            setupPerfilPage();
            break;
        case 'cadastro-produto.html':
            setupCadastroProduto();
            break;
        case 'produtos.html':
            // Esta função só deve ser chamada APÓS o Firebase estar pronto e o usuário logado (onAuthStateChanged)
            // A chamada real deve ser feita dentro do 'firebase-config.js' após o login/auth.
            // Para simulação, chamamos aqui:
            setTimeout(() => {
                if (auth.currentUser) {
                    setupProdutosPage();
                } else {
                    // Simulação de espera de autenticação.
                    console.warn("Aguardando autenticação para carregar produtos...");
                }
            }, 1000); 
            break;
        case 'index.html':
        default:
            // Nada a fazer no menu, apenas navegação
            break;
    }
};

// Exportar funções globais se necessário (ex: para o firebase-config.js chamar o setupProdutosPage)
export { setupProdutosPage, setupCadastroProduto, setupPerfilPage };
