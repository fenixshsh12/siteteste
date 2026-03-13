const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./cafe.db', (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
    }
});

db.serialize(() => {
    // Criação da tabela (Schema)
    db.run(`CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        descricao TEXT,
        preco REAL,
        categoria TEXT
    )`);

    // Inserindo dados de teste (Seed) caso a tabela esteja vazia
    db.get("SELECT COUNT(*) as count FROM produtos", (err, row) => {
        if (row && row.count === 0) {
            const stmt = db.prepare("INSERT INTO produtos (nome, descricao, preco, categoria) VALUES (?, ?, ?, ?)");
            stmt.run("Expresso Clássico", "Café puro, forte e encorpado, feito com grãos selecionados.", 5.50, "Bebidas Quentes");
            stmt.run("Cappuccino", "Expresso clássico com leite vaporizado e muita espuma cremosa.", 8.90, "Bebidas Quentes");
            stmt.run("Latte Macchiato", "Leite vaporizado suave com um shot perfeito de expresso.", 9.50, "Bebidas Quentes");
            stmt.run("Matcha Latte", "Infusão de chá verde japonês com leite vaporizado e um toque doce.", 11.00, "Bebidas Quentes");
            
            stmt.run("Croissant Tradicional", "Massa folhada amanteigada, fresquinha e incrivelmente crocante.", 7.00, "Comidas");
            stmt.run("Bolo de Cenoura Premium", "Fatia generosa com cascata de chocolate meio amargo 70% cacau.", 12.00, "Comidas");
            stmt.run("Pão de Queijo Mineiro", "Assado na hora, crocante por fora e macio por dentro.", 4.50, "Comidas");
            stmt.finalize();
            console.log("Banco de dados populado com produtos iniciais da cafeteria com sucesso!");
        }
    });
});

module.exports = db;
