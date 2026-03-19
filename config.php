<?php
// Configuração do banco de dados
$host = '127.0.0.1';
$port = '3307';
$dbname = 'estoque_roupas';
$username = 'root';
$password = '';

try {
    // Conexão com porta explícita
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8", $username, $password);
    
    // Configurar PDO para lançar exceções em erros
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
    // Teste de conexão (opcional)
    $pdo->query("SELECT 1");
    
} catch(PDOException $e) {
    // Log do erro
    error_log("ERRO DE CONEXÃO: " . $e->getMessage());
    
    // Se for uma requisição AJAX, retorna JSON
    if (strpos($_SERVER['REQUEST_URI'], '.php') !== false) {
        header('Content-Type: application/json');
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Erro de conexão com o banco de dados: ' . $e->getMessage()
        ]);
        exit;
    }
    
    // Se for acesso direto, mostra erro
    die("Erro de conexão: " . $e->getMessage());
}
?>