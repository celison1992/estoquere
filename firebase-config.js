// firebase-config.js

// Importa a função de setup LOCALMENTE. Lembre-se, apenas para arquivos locais.
import { setupCadastroProduto } from "./script.js"; 

// Configuração do Firebase ATUALIZADA (Use o objeto 'firebase' globalmente)
const firebaseConfig = {
    apiKey: "AIzaSyCTNWJfq0zcCzNSlnVDenKRy0xyvsEuCkI",
    authDomain: "estoquere-789ee.firebaseapp.com",
    projectId: "estoquere-789ee",
    storageBucket: "estoquere-789ee.firebasestorage.app",
    messagingSenderId: "774218509097",
    appId: "1:774218509097:web:e10628c4dd1da2e64be538", 
    measurementId: "G-B9PGWH5GHR"
};

// Inicializa Firebase usando o objeto global 'firebase' (v8-compat)
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(app); 
const auth = firebase.auth(app);

// Expor globalmente para uso em script.js (garantia)
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

// Autenticação e Inicialização do Script
firebase.auth().onAuthStateChanged(auth, async (user) => {
    // Extrai o nome do arquivo da URL
    const path = window.location.pathname.split('/').pop();

    if (user) {
        console.log("Usuário autenticado:", user.uid);
        toggleFormState(true);

        // Se estiver na página de cadastro, configure o formulário.
        // Garante que o setup só rode após o DOM estar pronto (crucial para o listener 'submit').
        if (path === 'cadastro-produto.html') {
            document.addEventListener('DOMContentLoaded', () => {
                setupCadastroProduto(user);
            });
        }

        // Se estiver na página de produtos, configure a listagem.
        if (path === 'produtos.html' && typeof window.setupProdutosPage === 'function') {
            document.addEventListener('DOMContentLoaded', () => {
                window.setupProdutosPage();
            });
        }
    } else {
        console.log("Tentando login anônimo...");
        try {
            await firebase.auth().signInAnonymously(auth);
            console.log("Login anônimo bem-sucedido.");
            // O onAuthStateChanged será chamado novamente com o 'user' logado.
        } catch (error) {
            console.error("Erro ao autenticar:", error);
            // Em caso de falha total, mantemos o formulário desabilitado ou habilitado para debug.
            toggleFormState(false);
        }
    }
});
