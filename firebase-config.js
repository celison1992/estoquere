// Configuração e Inicialização do Firebase
// ----------------------------------------------------
// Este arquivo trata da conexão inicial com o Firebase e autenticação.

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, setPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Importa a função de inicialização da página de produtos do script principal
// Isso garante que a página 'produtos.html' carregue os dados somente após a autenticação.
import { setupProdutosPage } from './script.js'; 

// Variáveis Globais (fornecidas pelo ambiente Canvas)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'estoquere-default';
// Tenta parsear a string de configuração ou usa um objeto vazio como fallback
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// ====================================================================
// 1. INICIALIZAÇÃO
// ====================================================================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Configura o nível de log para debug no Firestore (muito útil para verificação de regras de segurança)
setLogLevel('Debug');

/**
 * Retorna o ID do usuário. Prioriza o UID do usuário autenticado.
 * @param {object} authInstance A instância do Firebase Auth.
 * @returns {string} O ID único do usuário.
 */
const getUserId = (authInstance) => {
    // Usa o UID se o usuário estiver logado, senão gera um ID aleatório (para usuários anônimos/sessões não confirmadas)
    return authInstance.currentUser?.uid || crypto.randomUUID();
};

/**
 * Função placeholder para 'showMessage'. O feedback visual é tratado
 * pela função 'displayMessage' dentro do 'script.js'.
 */
const showMessage = (msg, type) => {
    console.log(`[FIREBASE STATUS ${type.toUpperCase()}]: ${msg}`);
};

// ====================================================================
// 2. AUTENTICAÇÃO
// ====================================================================

/**
 * Tenta autenticar o usuário usando o token personalizado (ambiente Canvas) ou anonimamente.
 */
const authenticateUser = async () => {
    try {
        // Define a persistência da sessão para manter o usuário logado
        await setPersistence(auth, browserSessionPersistence);

        if (initialAuthToken) {
            // Tenta logar com o token fornecido pelo ambiente Canvas
            await signInWithCustomToken(auth, initialAuthToken);
            console.log("Autenticação com token personalizado realizada.");
        } else {
            // Se não houver token, loga anonimamente
            await signInAnonymously(auth);
            console.warn("Nenhum token fornecido. Autenticação anônima realizada.");
        }
    } catch (error) {
        console.error("Erro na autenticação:", error);
    }
};

// ====================================================================
// 3. MONITORAMENTO DE ESTADO
// ====================================================================

// Monitora o estado de autenticação para carregar dados protegidos
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log(`Usuário autenticado. UID: ${user.uid}`);
        
        // Verifica se a página atual é 'produtos.html' para carregar os dados
        const path = window.location.pathname.split('/').pop();
        if (path === 'produtos.html') {
            // Chama a função de carregamento de produtos somente após a autenticação ser confirmada
            setupProdutosPage();
        }
    } else {
        console.log("Nenhum usuário logado. Apenas o modo anônimo está ativo.");
    }
});

// Inicia o processo de autenticação logo no carregamento
authenticateUser();


// Exporta instâncias e utilitários para uso no script.js
export { db, auth, getUserId, showMessage };
