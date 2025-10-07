// firebase-config.js

import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Importa a função de setup da página de cadastro
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

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Expor globalmente
window.db = db;
window.auth = auth;

// Controle de formulários
function toggleFormState(enabled) {
    // Certifique-se de que o ID do formulário está correto para a página de cadastro
    const forms = [document.getElementById('cadastroForm')]; 
    forms.forEach(form => {
        if (form) {
            Array.from(form.elements).forEach(el => el.disabled = !enabled);
        }
    });
}

// Autenticação
onAuthStateChanged(auth, async (user) => {
    // Extrai o nome do arquivo da URL para verificar a página atual
    const path = window.location.pathname.split('/').pop();

    if (user) {
        console.log("Usuário autenticado:", user.uid);
        toggleFormState(true);

        // Se estiver na página de cadastro, configure o formulário de cadastro
        if (path === 'cadastro-produto.html') {
            setupCadastroProduto(user); // Chama a função, passando o objeto 'user'
        }

        // Se estiver na página de produtos, configure a listagem (se a função existir)
        if (path === 'produtos.html' && typeof window.setupProdutosPage === 'function') {
            window.setupProdutosPage();
        }
    } else {
        console.log("Tentando login anônimo...");
        try {
            await signInAnonymously(auth);
            console.log("Login anônimo bem-sucedido.");
        } catch (error) {
            console.error("Erro ao autenticar:", error);
            toggleFormState(true);
        }
    }
});

export { db, auth };
