<?php
header('Content-Type: application/json');
require_once 'config.php';

$busca = $_GET['busca'] ?? '';

try {
    $sql = "SELECT * FROM produtos WHERE codigo = :busca OR nome LIKE :busca_nome LIMIT 1";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':busca' => $busca,
        ':busca_nome' => '%' . $busca . '%'
    ]);
    
    $produto = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($produto) {
        echo json_encode(['sucesso' => true, 'produto' => $produto]);
    } else {
        echo json_encode(['sucesso' => false, 'mensagem' => 'Produto não encontrado']);
    }
} catch(PDOException $e) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro na busca: ' . $e->getMessage()]);
}
?>