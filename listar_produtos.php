<?php
header('Content-Type: application/json');
require_once 'config.php';

try {
    $sql = "SELECT * FROM produtos ORDER BY data_cadastro DESC";
    $stmt = $pdo->query($sql);
    $produtos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['sucesso' => true, 'produtos' => $produtos]);
} catch(PDOException $e) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao listar produtos']);
}
?>