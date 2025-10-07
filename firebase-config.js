// Configuração do Firebase e Lógica de Autenticação (firebase-config.js)

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

let app;
let db;
let auth;

/**
 * Desabilita ou habilita formulários críticos para evitar submissão
 * antes da autenticação completa.
 */
function toggleFormState(enabled) {
    const forms = [
        document.getElementById('cadastroForm'),
        document.getElementById('perfilForm')
    ];
    forms.forEach(form => {
        if (form) {
            Array.from(form.elements).forEach(element => {
                element.disabled = !enabled;
            });
            console.log(enabled ? "Formulário habilitado." : "Formulário desabilitado.");
        }
    });
}

async function initFirebase() {
    try {
        if (Object.keys(firebaseConfig).length === 0) {
            console.error("Erro: firebaseConfig está vazio.");
            toggleFormState(true);
            return;
        }

        if (typeof window.setLogLevel === 'function') {
            window.setLogLevel('debug');
        }

        app = window.initializeApp(firebaseConfig);
        db = window.getFirestore(app);
        auth = window.getAuth(app);

        window.db = db;
        window.auth = auth;
        window.__app_id = appId;

        toggleFormState(false);

        window.onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log("Usuário autenticado:", user.uid);
                toggleFormState(true);

                const path = window.location.pathname.split('/').pop();
                if (path === 'produtos.html' && typeof window.setupProdutosPage === 'function') {
                    window.setupProdutosPage();
                }
            } else {
                console.log("Nenhum usuário logado. Tentando login...");

                try {
                    if (initialAuthToken) {
                        await window.signInWithCustomToken(auth, initialAuthToken);
                        console.log("Login com token personalizado.");
                    } else {
                        await window.signInAnonymously(auth);
                        console.log("Login anônimo.");
                    }
                } catch (loginError) {
                    console.error("Erro no login:", loginError);
                    toggleFormState(true);
                }
            }
        });

    } catch (error) {
        console.error("Falha ao inicializar Firebase:", error);
        toggleFormState(true);
    }
}

initFirebase();

export { db, auth, appId };
