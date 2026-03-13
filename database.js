const { Pool } = require('pg');

// Conexão IPv4 forçada (Render não suporta IPv6 puro do Supabase) 
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Caioemyris1.@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=disable';

// O Supabase usa Transaction Poolers por padrão na porta 6543.
const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

// Testa a conexão
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Erro ao conectar com o Supabase PostgreSQL', err.stack);
    }
    console.log('✅ Conectado com sucesso ao Supabase!');
    
    // Configura o banco de dados inicial na nuvem
    setupDatabase();
    release();
});

async function setupDatabase() {
    try {
        // Cria tabelas se não existirem
        await pool.query(`
            CREATE TABLE IF NOT EXISTS produtos (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(255),
                descricao TEXT,
                preco DECIMAL(10,2),
                categoria VARCHAR(100)
            )
        `);

        // Verifica se a tabela tá vazia antes de inserir o SEED
        const res = await pool.query('SELECT COUNT(*) as count FROM produtos');
        if (parseInt(res.rows[0].count) === 0) {
            console.log("Semeando (seeding) o banco de dados na nuvem pela primeira vez...");
            await pool.query(`
                INSERT INTO produtos (nome, descricao, preco, categoria) VALUES 
                ('Expresso Clássico', 'Café puro, forte e encorpado, feito com grãos selecionados.', 5.50, 'Bebidas Quentes'),
                ('Cappuccino', 'Expresso clássico com leite vaporizado e muita espuma cremosa.', 8.90, 'Bebidas Quentes'),
                ('Latte Macchiato', 'Leite vaporizado suave com um shot perfeito de expresso.', 9.50, 'Bebidas Quentes'),
                ('Matcha Latte', 'Infusão de chá verde japonês com leite vaporizado e um toque doce.', 11.00, 'Bebidas Quentes'),
                ('Croissant Tradicional', 'Massa folhada amanteigada, fresquinha e incrivelmente crocante.', 7.00, 'Comidas'),
                ('Bolo de Cenoura Premium', 'Fatia generosa com cascata de chocolate meio amargo 70% cacau.', 12.00, 'Comidas'),
                ('Pão de Queijo Mineiro', 'Assado na hora, crocante por fora e macio por dentro.', 4.50, 'Comidas')
            `);
            console.log("Banco na nuvem populado com sucesso!");
        }
    } catch (err) {
        console.error("Erro na configuração do banco de dados", err);
    }
}

// Em vez de sqlite (.all, .run), o Postgres usa pool.query
module.exports = {
    query: (text, params) => pool.query(text, params),
};
