<?php
header('Content-Type: application/json');
require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

try {
    $sql = "UPDATE produtos SET codigo = :codigo, nome = :nome, tamanho = :tamanho, 
            valor = :valor, quantidade = :quantidade WHERE id = :id";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id' => $data['id'],
        ':codigo' => $data['codigo'],
        ':nome' => $data['nome'],
        ':tamanho' => $data['tamanho'],
        ':valor' => $data['valor'],
        ':quantidade' => $data['quantidade']
    ]);
    
    echo json_encode(['sucesso' => true]);
} catch(PDOException $e) {
    echo json_encode(['sucesso' => false]);
}
?>