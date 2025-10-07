// firebase-config.js

// REMOVA ESTAS LINHAS:
// import { initializeApp } from "firebase/app";
// import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";

// Apenas importe o script local que você precisa
import { setupCadastroProduto } from "./script.js"; 

// Configuração do Firebase
const firebaseConfig = {
    // ... (restante da configuração)
};

// Inicializa Firebase usando as funções globais
const app = firebase.initializeApp(firebaseConfig); // Use firebase.initializeApp
const db = firebase.firestore(app); // Use firebase.firestore
const auth = firebase.auth(app); // Use firebase.auth

// Expor globalmente (já estava correto)
window.db = db;
window.auth = auth;

// Controle de formulários (permanece igual)
function toggleFormState(enabled) {
    // ...
}

// Autenticação (Use as funções globais)
firebase.auth().onAuthStateChanged(auth, async (user) => { // Use firebase.auth().onAuthStateChanged
    const path = window.location.pathname.split('/').pop(); 

    if (user) {
        console.log("Usuário autenticado:", user.uid);
        toggleFormState(true);

        if (path === 'cadastro-produto.html') {
            setupCadastroProduto(user); 
        }

        if (path === 'produtos.html' && typeof window.setupProdutosPage === 'function') {
            window.setupProdutosPage();
        }
    } else {
        console.log("Tentando login anônimo...");
        try {
            await firebase.auth().signInAnonymously(auth); // Use firebase.auth().signInAnonymously
            console.log("Login anônimo bem-sucedido.");
        } catch (error) {
            console.error("Erro ao autenticar:", error);
            toggleFormState(true);
        }
    }
});

// REMOVA O EXPORT para evitar conflitos de módulo, 
// pois agora as variáveis já são acessadas globalmente (window.db, window.auth)

// export { db, auth }; // <-- REMOVA ISTO
