<?php
header('Content-Type: application/json');
require_once 'config.php';

$produto_id = $_GET['produto_id'] ?? 0;

try {
    $sql = "SELECT * FROM promocoes 
            WHERE produto_id = :produto_id 
            AND ativa = 1 
            AND data_inicio <= CURDATE() 
            AND data_fim >= CURDATE()
            AND (codigo_promocional IS NULL OR codigo_promocional = '')
            LIMIT 1";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':produto_id' => $produto_id]);
    $promocao = $stmt->fetch();
    
    if ($promocao) {
        echo json_encode(['sucesso' => true, 'promocao' => $promocao]);
    } else {
        echo json_encode(['sucesso' => false]);
    }
    
} catch(Exception $e) {
    echo json_encode(['sucesso' => false, 'mensagem' => $e->getMessage()]);
}
?>