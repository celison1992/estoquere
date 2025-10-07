// Configuração do Firebase (firebase-config.js)
// Este arquivo é responsável por inicializar o Firebase e garantir a autenticação do usuário.

// IMPORTAÇÕES OBRIGATÓRIAS
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { doc, collection } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js"; // Importações adicionais para tipagem e referência

// Variáveis globais para serem usadas em script.js
export let db;
export let auth;
export let userId = null;
export let isAuthReady = false;

// 1. Configurações e Inicialização
// As variáveis __app_id, __firebase_config e __initial_auth_token são fornecidas pelo ambiente Canvas.

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Ativa o log de debug do Firestore (Útil durante o desenvolvimento)
setLogLevel('debug');

try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    
    console.log("Firebase App e Firestore inicializados com sucesso.");

} catch (error) {
    console.error("Erro ao inicializar Firebase:", error);
}

/**
 * 2. Autenticação e Monitoramento do Estado do Usuário
 * Garante que o usuário esteja logado (seja com token ou anonimamente)
 * e que a lógica da aplicação só comece após o ID do usuário ser definido.
 */
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        try {
            
            if (initialToken) {
                // Tenta autenticar com o token personalizado do Canvas
                await signInWithCustomToken(auth, initialToken);
            } else {
                // Faz login anônimo se o token não estiver disponível (ambiente local)
                await signInAnonymously(auth);
            }
            // O listener onAuthStateChanged será chamado novamente com o novo 'user'
            console.log("Autenticação inicial tentada.");

        } catch (error) {
            console.error("Erro na autenticação inicial:", error);
        }
    } else {
        // Usuário logado (ou anônimo)
        userId = user.uid;
        isAuthReady = true;
        console.log(`Usuário autenticado. UID: ${userId}`);

        // Chama funções de inicialização da página principal (script.js) APÓS a autenticação
        // As funções de setup de páginas (produtos, perfil) são definidas em script.js e só podem
        // rodar após o auth.currentUser estar disponível.
        if (typeof setupProdutosPage === 'function') {
            setupProdutosPage();
        }
        if (typeof loadUserProfile === 'function') {
            loadUserProfile();
        }
    }
});

/**
 * Função utilitária para obter o ID do usuário.
 * Usada por outras partes do script.js para construir caminhos no Firestore.
 * @returns {string | null} O UID do usuário ou null.
 */
export function getUserId() {
    return userId;
}

/**
 * Função utilitária para obter o ID da Aplicação.
 * @returns {string} O ID da aplicação.
 */
export function getAppId() {
    return appId;
}
