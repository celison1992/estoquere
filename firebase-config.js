// firebase-config.js

// Importação LOCAL para a função do script.js
import { setupCadastroProduto } from "./script.js"; 

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCTNWJfq0zcCzNSlnVDenKRy0xyvsEuCkI",
    authDomain: "estoquere-789ee.firebaseapp.com",
    projectId: "estoquere-789ee",
    storageBucket: "estoquere-789ee.firebasestorage.app",
    messagingSenderId: "774218509097",
    appId: "1:774218509097:web:49483c7fd8ace7b94be538",
    measurementId: "G-Y4BN386CM6"
};

// Inicializa Firebase usando o objeto global 'firebase'
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(app); // Associa o Firestore
const auth = firebase.auth(app);     // Associa a Autenticação

// Expor globalmente para uso em script.js (agora desnecessário, mas mantido)
window.db = db;
window.auth = auth;

// Controle de formulários
function toggleFormState(enabled) {
    const forms = [document.getElementById('cadastroForm')];
    forms.forEach(form => {
        if (form) {
            Array.from(form.elements).forEach(el => el.disabled = !enabled);
        }
    });
}

// Autenticação (Usando funções globais)
firebase.auth().onAuthStateChanged(auth, async (user) => {
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
            await firebase.auth().signInAnonymously(auth);
            console.log("Login anônimo bem-sucedido.");
        } catch (error) {
            console.error("Erro ao autenticar:", error);
            toggleFormState(true);
        }
    }
});

// Removemos a exportação para evitar conflitos de módulo
// export { db, auth };
