import { db, auth } from './firebase-config.js';
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy
} from 'firebase/firestore';

// ==============================
// 1. Cadastro de Produto
// ==============================
window.onAuthStateChanged(auth, (user) => {
    if (user && window.location.pathname.includes('cadastro-produto.html')) {
        const form = document.getElementById('cadastroForm');
        const custoInput = document.getElementById('custoInput');
        const margemInput = document.getElementById('margemInput');
        const precoVendaInput = document.getElementById('precoVendaInput');

        // Atualiza preço de venda automaticamente
        function calcularPrecoVenda() {
            const custo = parseFloat(custoInput.value) || 0;
            const margem = parseFloat(margemInput.value) || 0;
            const venda = custo + (custo * margem / 100);
            precoVendaInput.value = venda.toFixed(2);
        }

        // Dispara o cálculo ao carregar a página e ao alterar os campos
        window.addEventListener('DOMContentLoaded', calcularPrecoVenda);
        custoInput.addEventListener('input', calcularPrecoVenda);
        margemInput.addEventListener('input', calcularPrecoVenda);

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const codigo = document.getElementById('codigoBarras').value;
            const marca = document.getElementById('marca').value;
            const descricao = document.getElementById('productDescription').value;
            const custo = parseFloat(custoInput.value);
            const margem = parseFloat(margemInput.value);
            const venda = parseFloat(precoVendaInput.value);
            const quantidade = parseInt(document.getElementById('productQuantity').value);

            try {
                await addDoc(collection(db, 'produtos'), {
                    codigo,
                    marca,
                    descricao,
                    custo,
                    margem,
                    venda,
                    quantidade,
                    criadoPor: user.uid,
                    criadoEm: new Date()
                });

                const box = document.getElementById('messageBox');
                box.textContent = '✅ Produto cadastrado com sucesso!';
                box.classList.remove('hidden');
                box.classList.add('bg-green-100', 'text-green-700');
                form.reset();
                precoVendaInput.value = '0.00';
            } catch (error) {
                console.error('Erro ao salvar produto:', error);
                const box = document.getElementById('messageBox');
                box.textContent = '❌ Erro ao salvar produto.';
                box.classList.remove('hidden');
                box.classList.add('bg-red-100', 'text-red-700');
            }
        });
    }
});

// ==============================
// 2. Listagem de Produtos
// ==============================
window.setupProdutosPage = function () {
    const tbody = document.getElementById('productsTableBody');
    const loadingStatus = document.getElementById('loadingStatus');

    const produtosRef = collection(db, 'produtos');
    const produtosQuery = query(produtosRef, orderBy('criadoEm', 'desc'));

    onSnapshot(produtosQuery, (snapshot) => {
        tbody.innerHTML = '';

        if (snapshot.empty) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-gray-500 italic">
                        Nenhum produto cadastrado ainda.
                    </td>
                </tr>
            `;
            return;
        }

        snapshot.forEach(doc => {
            const p = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 font-mono text-sm">${p.codigo}</td>
                <td class="px-6 py-4">${p.descricao}</td>
                <td class="px-6 py-4">${p.marca}</td>
                <td class="px-6 py-4 text-right text-red-600 font-semibold">R$ ${p.custo.toFixed(2)}</td>
                <td class="px-6 py-4 text-right text-green-700 font-bold">R$ ${p.venda.toFixed(2)}</td>
                <td class="px-6 py-4 text-center">${p.quantidade}</td>
            `;
            tbody.appendChild(row);
        });

        loadingStatus.textContent = `Total de produtos: ${snapshot.size}`;
    });
};
