// Exemplo (Substitua pelos seus dados reais)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = { /* ... Suas chaves ... */ };
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const produtosRef = collection(db, "produtos");
export { addDoc };
