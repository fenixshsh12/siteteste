const express = require('express');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Servindo a página estática no frontend (CSS, JS, Imagens, HTML)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Rota para consultar o banco de dados do Supabase
app.get('/api/produtos', async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM produtos ORDER BY id ASC");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Rota de Checkout Simulada (Mock Payment & Verification)
app.post('/api/checkout', (req, res) => {
    const { items, method, details } = req.body;
    
    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Carrinho vazio.' });
    }

    // Simulando delay de processamento (Antifraude, Conexão com Gateway de Pagamento, etc)
    setTimeout(() => {
        if (method === 'pix') {
            // PIX sempre aprova no nosso mock após uns segundos, mas poderíamos simular algo dinâmico.
            return res.json({ success: true, message: 'Pagamento via PIX recebido e confirmado com sucesso!' });
        } 
        
        if (method === 'credit') {
            // Validando regras basicas mock de cartão
            const { cardNumber, expiry, cvv } = details;
            
            if (cardNumber.length < 13 || cardNumber.length > 19) {
                return res.status(400).json({ error: 'Cartão de crédito recusado: Número inválido.' });
            }

            if (cvv.length < 3) {
                return res.status(400).json({ error: 'Cartão de crédito recusado: CVV inválido.' });
            }

            return res.json({ success: true, message: 'Pagamento no Cartão de Crédito aprovado e processado!' });
        }

        res.status(400).json({ error: 'Método de pagamento desconhecido' });
    }, 1500);
});

// Inicializando o servidor
app.listen(PORT, () => {
    console.log(`☕ Sistema da Cafeteria online!`);
    console.log(`Navegue para: http://localhost:${PORT}`);
});
