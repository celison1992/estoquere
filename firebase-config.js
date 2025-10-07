// Configuração do Firebase e Lógica de Autenticação (firebase-config.js)

// Variáveis globais fornecidas pelo ambiente (Canvas/Immersive)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// ====================================================================
// 1. Importações do Firebase
// ====================================================================

// O ambiente de Canvas injeta essas importações globalmente.
// Funções do Firebase (initializeApp, getAuth, getFirestore, etc.) são assumidas no 'window'.

let app;
let db;
let auth;

// ====================================================================
// 2. Funções de Suporte
// ====================================================================

/**
 * Desabilita ou habilita formulários críticos para evitar submissão
 * antes da autenticação completa.
 * @param {boolean} enabled - true para habilitar, false para desabilitar.
 */
function toggleFormState(enabled) {
    const forms = [
        document.getElementById('cadastroForm'), 
        document.getElementById('perfilForm')
    ];
    forms.forEach(form => {
        if (form) {
            // Desabilita todos os inputs e botões
            Array.from(form.elements).forEach(element => {
                element.disabled = !enabled;
            });

            // Se for desabilitado, pode adicionar uma mensagem de carregamento.
            // Se for reabilitado, garante que qualquer mensagem de carregamento desapareça.
            if (!enabled) {
                console.log("Formulário desabilitado: Aguardando autenticação.");
            } else {
                console.log("Formulário habilitado: Autenticação completa.");
            }
        }
    });
}


// ====================================================================
// 3. Inicialização e Autenticação
// ====================================================================

async function initFirebase() {
    try {
        if (Object.keys(firebaseConfig).length === 0) {
            console.error("Erro: firebaseConfig está vazia. Não é possível inicializar o Firebase.");
            return;
        }

        // Habilita logs de debug do Firebase (útil para desenvolvimento)
        if (typeof window.setLogLevel === 'function') {
             window.setLogLevel('debug');
        }

        // 1. Inicializa o Firebase App
        app = window.initializeApp(firebaseConfig);
        db = window.getFirestore(app);
        auth = window.getAuth(app);
        
        // 2. Expondo db e auth globalmente para o script.js
        window.db = db;
        window.auth = auth;
        window.__app_id = appId;
        
        // 3. Desabilita formulários enquanto a autenticação está pendente
        toggleFormState(false);


        // 4. Configura o ouvinte de estado de autenticação
        window.onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Usuário autenticado
                console.log("Usuário autenticado:", user.uid);
                
                // Reabilita formulários
                toggleFormState(true);

                // Verifica a URL e chama a função de setup específica se a autenticação estiver pronta
                const path = window.location.pathname.split('/').pop();
                if (path === 'produtos.html' && typeof window.setupProdutosPage === 'function') {
                    // setupProdutosPage é a função no script.js que configura o onSnapshot
                    window.setupProdutosPage(); 
                }
            } else {
                // Se não há usuário, tenta login (pode ser a primeira vez)
                console.log("Nenhum usuário logado. Tentando login...");

                // Tenta fazer login com o Custom Token ou Anonimamente
                try {
                    if (initialAuthToken) {
                        await window.signInWithCustomToken(auth, initialAuthToken);
                        console.log("Login com token personalizado bem-sucedido.");
                    } else {
                        await window.signInAnonymously(auth);
                        console.log("Login anônimo bem-sucedido.");
                    }
                } catch (loginError) {
                    console.error("Falha na tentativa de login:", loginError);
                    // Garante que os formulários sejam reabilitados mesmo após falha na tentativa
                    toggleFormState(true);
                }
            }
        });

    } catch (error) {
        console.error("Falha ao inicializar ou autenticar o Firebase:", error);
        toggleFormState(true); // Garante que os formulários não fiquem travados em caso de falha de inicialização
    }
}

// Inicia o processo de configuração do Firebase
initFirebase();

// Expor variáveis para uso no script.js (redundante devido ao window.db/auth, mas útil para módulos)
export { db, auth, appId }; 
