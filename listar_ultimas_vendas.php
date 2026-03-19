<?php
header('Content-Type: application/json');
require_once 'config.php';

try {
    $sql = "SELECT * FROM vendas ORDER BY data_venda DESC LIMIT 10";
    $stmt = $pdo->query($sql);
    $vendas = $stmt->fetchAll();
    
    echo json_encode(['sucesso' => true, 'vendas' => $vendas]);
} catch(Exception $e) {
    echo json_encode(['sucesso' => false, 'mensagem' => $e->getMessage()]);
}
?>