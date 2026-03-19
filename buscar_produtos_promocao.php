<?php
header('Content-Type: application/json');
require_once 'config.php';

try {
    $sql = "SELECT p.* FROM produtos p 
            INNER JOIN promocoes pr ON p.id = pr.produto_id 
            WHERE pr.ativa = 1 AND pr.data_inicio <= CURDATE() AND pr.data_fim >= CURDATE()";
    
    $stmt = $pdo->query($sql);
    $produtos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['sucesso' => true, 'produtos' => $produtos]);
} catch(PDOException $e) {
    echo json_encode(['sucesso' => false, 'mensagem' => $e->getMessage()]);
}
?>