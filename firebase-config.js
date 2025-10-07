// Configuração do Firebase e Lógica de Autenticação (firebase-config.js)

// Variáveis globais fornecidas pelo ambiente (Canvas/Immersive)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// ====================================================================
// 1. Importações do Firebase
// ====================================================================

// O ambiente de Canvas injeta essas importações globalmente, mas as listamos para referência.
// Para rodar localmente, você precisaria de imports como:
// import { initializeApp } from "firebase/app";
// import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "firebase/auth";
// import { getFirestore, setDoc, doc, collection, onSnapshot, query } from "firebase/firestore";

let app;
let db;
let auth;

// ====================================================================
// 2. Inicialização e Autenticação
// ====================================================================

async function initFirebase() {
    try {
        if (Object.keys(firebaseConfig).length === 0) {
            console.error("Erro: firebaseConfig está vazia. Não é possível inicializar o Firebase.");
            return;
        }

        // Inicializa o Firebase App (assumindo que initializeApp está no escopo global)
        app = window.initializeApp(firebaseConfig);
        db = window.getFirestore(app);
        auth = window.getAuth(app);
        
        // Expondo db e auth globalmente para o script.js
        window.db = db;
        window.auth = auth;
        window.__app_id = appId;

        // Configura o ouvinte de estado de autenticação
        window.onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Usuário autenticado
                console.log("Usuário autenticado:", user.uid);
                
                // Verifica a URL e chama a função de setup específica se a autenticação estiver pronta
                const path = window.location.pathname.split('/').pop();
                if (path === 'produtos.html' && typeof window.setupProdutosPage === 'function') {
                    // setupProdutosPage é a função no script.js que configura o onSnapshot
                    window.setupProdutosPage(); 
                }
            } else {
                console.log("Nenhum usuário logado. Tentando login...");

                // Tenta fazer login com o Custom Token ou Anonimamente
                if (initialAuthToken) {
                    await window.signInWithCustomToken(auth, initialAuthToken);
                    console.log("Login com token personalizado bem-sucedido.");
                } else {
                    await window.signInAnonymously(auth);
                    console.log("Login anônimo bem-sucedido.");
                }
            }
        });

    } catch (error) {
        console.error("Falha ao inicializar ou autenticar o Firebase:", error);
    }
}

// Inicia o processo de configuração do Firebase
initFirebase();

// Expor variáveis para uso no script.js (redundante devido ao window.db/auth, mas útil para módulos)
export { db, auth, appId }; 
