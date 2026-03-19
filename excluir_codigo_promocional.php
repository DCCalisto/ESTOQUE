<?php
header('Content-Type: application/json');
require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

try {
    $sql = "DELETE FROM promocoes WHERE id = :id AND codigo_promocional IS NOT NULL";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $data['id']]);
    
    echo json_encode(['sucesso' => true]);
    
} catch(PDOException $e) {
    echo json_encode(['sucesso' => false, 'mensagem' => $e->getMessage()]);
}
?>