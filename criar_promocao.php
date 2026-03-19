<?php
header('Content-Type: application/json');
require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

try {
    $pdo->beginTransaction();
    
    // Gerar código promocional se não fornecido
    $codigoPromocional = $data['codigo_promocional'];
    if (!$codigoPromocional) {
        // Gerar código único
        $prefixos = ['PROMO', 'DESC', 'VERAO', 'LIQUIDA', 'OFERTA'];
        $prefixo = $prefixos[array_rand($prefixos)];
        $numero = rand(100, 999);
        $codigoPromocional = $prefixo . $numero;
        
        // Verificar se já existe
        $sql = "SELECT id FROM promocoes WHERE codigo_promocional = :codigo";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':codigo' => $codigoPromocional]);
        
        while ($stmt->fetch()) {
            $numero = rand(100, 999);
            $codigoPromocional = $prefixo . $numero;
            $stmt->execute([':codigo' => $codigoPromocional]);
        }
    }
    
    $sql = "INSERT INTO promocoes (produto_id, tipo_desconto, desconto_percentual, valor_desconto_fixo, 
            codigo_promocional, data_inicio, data_fim, ativa) 
            VALUES (:produto_id, :tipo_desconto, :desconto_percentual, :valor_desconto_fixo, 
            :codigo_promocional, :data_inicio, :data_fim, 1)";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':produto_id' => $data['produto_id'],
        ':tipo_desconto' => $data['tipo_desconto'],
        ':desconto_percentual' => $data['desconto_percentual'],
        ':valor_desconto_fixo' => $data['valor_desconto_fixo'],
        ':codigo_promocional' => $codigoPromocional,
        ':data_inicio' => $data['data_inicio'],
        ':data_fim' => $data['data_fim']
    ]);
    
    $pdo->commit();
    
    echo json_encode([
        'sucesso' => true, 
        'codigo' => $codigoPromocional,
        'mensagem' => "Promoção criada! Código: $codigoPromocional"
    ]);
    
} catch(PDOException $e) {
    $pdo->rollBack();
    echo json_encode(['sucesso' => false, 'mensagem' => $e->getMessage()]);
}
?>