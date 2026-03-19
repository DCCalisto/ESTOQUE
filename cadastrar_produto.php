<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Se for requisição OPTIONS (preflight), retorna OK
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

// Log para debug
error_log("=== CADASTRO DE PRODUTO ===");
$input = file_get_contents('php://input');
error_log("Input: " . $input);

$data = json_decode($input, true);

try {
    if (!$data) {
        throw new Exception('Dados não recebidos');
    }
    
    // Validar campos obrigatórios
    $campos = ['codigo', 'nome', 'tamanho', 'valor', 'quantidade'];
    foreach ($campos as $campo) {
        if (!isset($data[$campo]) || empty($data[$campo])) {
            throw new Exception("Campo '$campo' é obrigatório");
        }
    }
    
    // Inserir no banco
    $sql = "INSERT INTO produtos (codigo, nome, tamanho, valor, quantidade) 
            VALUES (:codigo, :nome, :tamanho, :valor, :quantidade)";
    
    $stmt = $pdo->prepare($sql);
    $resultado = $stmt->execute([
        ':codigo' => $data['codigo'],
        ':nome' => $data['nome'],
        ':tamanho' => $data['tamanho'],
        ':valor' => $data['valor'],
        ':quantidade' => $data['quantidade']
    ]);
    
    if ($resultado) {
        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Produto cadastrado com sucesso!',
            'codigo_gerado' => $data['codigo']
        ]);
    } else {
        throw new Exception('Erro ao inserir no banco');
    }
    
} catch(PDOException $e) {
    error_log("Erro PDO: " . $e->getMessage());
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Erro no banco: ' . $e->getMessage()
    ]);
} catch(Exception $e) {
    error_log("Erro geral: " . $e->getMessage());
    echo json_encode([
        'sucesso' => false,
        'mensagem' => $e->getMessage()
    ]);
}
?>