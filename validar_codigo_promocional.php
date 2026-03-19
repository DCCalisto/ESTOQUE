<?php
header('Content-Type: application/json');
require_once 'config.php';

$codigo = $_GET['codigo'] ?? '';

try {
    $sql = "SELECT p.*, prod.nome as nome_produto 
            FROM promocoes p 
            LEFT JOIN produtos prod ON p.produto_id = prod.id 
            WHERE p.codigo_promocional = :codigo 
            AND p.ativa = 1 
            AND p.data_inicio <= CURDATE() 
            AND p.data_fim >= CURDATE()";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':codigo' => $codigo]);
    $promocao = $stmt->fetch();
    
    if ($promocao) {
        // Verificar limite de usos
        if ($promocao['limite_uso']) {
            $sql = "SELECT COUNT(*) as usado FROM uso_codigos_promocionais WHERE codigo_promocional = :codigo";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':codigo' => $codigo]);
            $usado = $stmt->fetch();
            
            if ($usado['usado'] >= $promocao['limite_uso']) {
                echo json_encode(['sucesso' => false, 'mensagem' => 'Código atingiu o limite de usos']);
                exit;
            }
        }
        
        $tipo = $promocao['tipo_desconto'] == 'percentual' ? '%' : 'R$';
        $valor = $promocao['tipo_desconto'] == 'percentual' 
            ? $promocao['desconto_percentual'] . '%' 
            : 'R$ ' . number_format($promocao['valor_desconto_fixo'], 2);
        
        $aplicavel = $promocao['aplicavel_todos'] 
            ? 'Válido para qualquer produto' 
            : "Válido para: {$promocao['nome_produto']}";
        
        $valorMinimo = $promocao['valor_minimo'] > 0 
            ? " (mínimo R$ " . number_format($promocao['valor_minimo'], 2) . ")" 
            : '';
        
        echo json_encode([
            'sucesso' => true,
            'promocao' => $promocao,
            'mensagem' => "Desconto de $valor $aplicavel$valorMinimo"
        ]);
    } else {
        echo json_encode(['sucesso' => false, 'mensagem' => 'Código inválido ou expirado']);
    }
    
} catch(Exception $e) {
    echo json_encode(['sucesso' => false, 'mensagem' => $e->getMessage()]);
}
?>