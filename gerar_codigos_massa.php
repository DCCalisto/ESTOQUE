<?php
header('Content-Type: application/json');
require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

try {
    $pdo->beginTransaction();
    
    $quantidade = $data['quantidade'];
    $codigosGerados = [];
    
    $data_inicio = date('Y-m-d');
    $data_fim = date('Y-m-d', strtotime('+30 days'));
    
    $nomes = [
        'Verão', 'Inverno', 'Primavera', 'Outono',
        'Natal', 'Ano Novo', 'Carnaval', 'Páscoa',
        'Black Friday', 'Cyber Monday', 'Dia das Mães', 'Dia dos Pais',
        'Liquidação', 'Promoção Relâmpago', 'Oferta Especial', 'Desconto Progressivo'
    ];
    
    for ($i = 0; $i < $quantidade; $i++) {
        // Escolher nome aleatório
        $nomeBase = $nomes[array_rand($nomes)];
        $nomePromocao = $nomeBase . ' ' . ($i + 1);
        
        // Gerar código único
        $prefixo = strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $nomeBase), 0, 4));
        $numero = rand(100, 999);
        $codigo = $prefixo . $numero;
        
        // Verificar se já existe
        $sql = "SELECT id FROM promocoes WHERE codigo_promocional = :codigo";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':codigo' => $codigo]);
        
        while ($stmt->fetch()) {
            $numero = rand(100, 999);
            $codigo = $prefixo . $numero;
            $stmt->execute([':codigo' => $codigo]);
        }
        
        // Inserir código genérico com 10% de desconto
        $sql = "INSERT INTO promocoes (nome_promocao, tipo_desconto, desconto_percentual, codigo_promocional, 
                aplicavel_todos, data_inicio, data_fim, ativa) 
                VALUES (:nome_promocao, 'percentual', 10, :codigo, 1, :data_inicio, :data_fim, 1)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':nome_promocao' => $nomePromocao,
            ':codigo' => $codigo,
            ':data_inicio' => $data_inicio,
            ':data_fim' => $data_fim
        ]);
        
        $codigosGerados[] = $codigo;
    }
    
    $pdo->commit();
    
    echo json_encode([
        'sucesso' => true, 
        'quantidade' => count($codigosGerados),
        'codigos' => $codigosGerados
    ]);
    
} catch(Exception $e) {
    $pdo->rollBack();
    echo json_encode(['sucesso' => false, 'mensagem' => $e->getMessage()]);
}
?>