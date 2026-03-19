<?php
header('Content-Type: application/json');
require_once 'config.php';

try {
    $sql = "SELECT p.*, 
            prod.nome as nome_produto,
            (SELECT COUNT(*) FROM uso_codigos_promocionais WHERE codigo_promocional = p.codigo_promocional) as uso_atual
            FROM promocoes p 
            LEFT JOIN produtos prod ON p.produto_id = prod.id 
            WHERE p.codigo_promocional IS NOT NULL 
            AND p.codigo_promocional != ''
            ORDER BY p.data_fim DESC";
    
    $stmt = $pdo->query($sql);
    $codigos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['sucesso' => true, 'codigos' => $codigos]);
    
} catch(PDOException $e) {
    echo json_encode(['sucesso' => false, 'mensagem' => $e->getMessage()]);
}
?>