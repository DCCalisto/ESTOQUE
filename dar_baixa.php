<?php
header('Content-Type: application/json');
require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

try {
    $pdo->beginTransaction();
    
    // Verificar se o produto existe
    $sql = "SELECT * FROM produtos WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $data['id']]);
    $produto = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$produto) {
        throw new Exception('Produto não encontrado');
    }
    
    if ($produto['quantidade'] <= 0) {
        throw new Exception('Produto sem estoque');
    }
    
    // Registrar a venda
    $sql = "INSERT INTO vendas (produto_id, codigo_produto, nome_produto, valor_original, forma_pagamento) 
            VALUES (:produto_id, :codigo, :nome, :valor, 'Baixa manual')";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':produto_id' => $produto['id'],
        ':codigo' => $produto['codigo'],
        ':nome' => $produto['nome'],
        ':valor' => $produto['valor']
    ]);
    
    // Atualizar quantidade
    $novaQuantidade = $produto['quantidade'] - 1;
    if ($novaQuantidade == 0) {
        // Excluir produto se quantidade zerar
        $sql = "DELETE FROM produtos WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $data['id']]);
    } else {
        // Atualizar quantidade
        $sql = "UPDATE produtos SET quantidade = :quantidade WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':quantidade' => $novaQuantidade,
            ':id' => $data['id']
        ]);
    }
    
    $pdo->commit();
    echo json_encode(['sucesso' => true]);
} catch(Exception $e) {
    $pdo->rollBack();
    echo json_encode(['sucesso' => false, 'mensagem' => $e->getMessage()]);
}
?>