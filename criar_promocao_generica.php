<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

// Log para debug
error_log("Dados recebidos: " . print_r($data, true));

try {
    $pdo->beginTransaction();
    
    // Validar campos obrigatórios
    if (empty($data['nome_promocao'])) {
        throw new Exception('Nome da promoção é obrigatório');
    }
    
    if (empty($data['codigo_promocional'])) {
        throw new Exception('Código promocional é obrigatório');
    }
    
    if (empty($data['data_inicio']) || empty($data['data_fim'])) {
        throw new Exception('Datas de início e fim são obrigatórias');
    }
    
    // Verificar se código já existe
    $sql = "SELECT id FROM promocoes WHERE codigo_promocional = :codigo";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':codigo' => $data['codigo_promocional']]);
    
    if ($stmt->fetch()) {
        throw new Exception('Código promocional já existe');
    }
    
    // Preparar valores de desconto
    $desconto_percentual = null;
    $valor_desconto_fixo = 0;
    
    if ($data['tipo_desconto'] === 'percentual') {
        $desconto_percentual = $data['desconto_percentual'];
        if (!$desconto_percentual || $desconto_percentual <= 0) {
            throw new Exception('Percentual de desconto inválido');
        }
    } else {
        $valor_desconto_fixo = $data['valor_desconto_fixo'];
        if (!$valor_desconto_fixo || $valor_desconto_fixo <= 0) {
            throw new Exception('Valor de desconto inválido');
        }
    }
    
    $sql = "INSERT INTO promocoes (nome_promocao, produto_id, tipo_desconto, desconto_percentual, valor_desconto_fixo, 
            codigo_promocional, aplicavel_todos, valor_minimo, data_inicio, data_fim, limite_uso, ativa) 
            VALUES (:nome_promocao, :produto_id, :tipo_desconto, :desconto_percentual, :valor_desconto_fixo, 
            :codigo_promocional, :aplicavel_todos, :valor_minimo, :data_inicio, :data_fim, :limite_uso, 1)";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':nome_promocao' => $data['nome_promocao'],
        ':produto_id' => $data['produto_id'],
        ':tipo_desconto' => $data['tipo_desconto'],
        ':desconto_percentual' => $desconto_percentual,
        ':valor_desconto_fixo' => $valor_desconto_fixo,
        ':codigo_promocional' => $data['codigo_promocional'],
        ':aplicavel_todos' => ($data['tipo_codigo'] === 'generico') ? 1 : 0,
        ':valor_minimo' => $data['valor_minimo'] ?: 0,
        ':data_inicio' => $data['data_inicio'],
        ':data_fim' => $data['data_fim'],
        ':limite_uso' => $data['limite_uso'] ?: null
    ]);
    
    $pdo->commit();
    
    echo json_encode([
        'sucesso' => true, 
        'codigo' => $data['codigo_promocional'],
        'nome' => $data['nome_promocao']
    ]);
    
} catch(PDOException $e) {
    $pdo->rollBack();
    error_log("Erro PDO: " . $e->getMessage());
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro no banco: ' . $e->getMessage()]);
} catch(Exception $e) {
    $pdo->rollBack();
    error_log("Erro geral: " . $e->getMessage());
    echo json_encode(['sucesso' => false, 'mensagem' => $e->getMessage()]);
}
?>