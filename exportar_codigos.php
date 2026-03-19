<?php
require_once 'config.php';

try {
    $sql = "SELECT p.codigo_promocional, prod.nome as produto, 
                   p.tipo_desconto, p.desconto_percentual, p.valor_desconto_fixo,
                   p.data_inicio, p.data_fim
            FROM promocoes p 
            JOIN produtos prod ON p.produto_id = prod.id 
            WHERE p.codigo_promocional IS NOT NULL 
            AND p.codigo_promocional != ''
            ORDER BY p.data_fim DESC";
    
    $stmt = $pdo->query($sql);
    $codigos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Criar arquivo CSV
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=codigos_promocionais.csv');
    
    $output = fopen('php://output', 'w');
    
    // Cabeçalho
    fputcsv($output, ['Código', 'Produto', 'Tipo', 'Valor', 'Data Início', 'Data Fim']);
    
    // Dados
    foreach ($codigos as $codigo) {
        $valor = $codigo['tipo_desconto'] == 'percentual' 
            ? $codigo['desconto_percentual'] . '%' 
            : 'R$ ' . number_format($codigo['valor_desconto_fixo'], 2);
        
        fputcsv($output, [
            $codigo['codigo_promocional'],
            $codigo['produto'],
            $codigo['tipo_desconto'] == 'percentual' ? 'Percentual' : 'Fixo',
            $valor,
            $codigo['data_inicio'],
            $codigo['data_fim']
        ]);
    }
    
    fclose($output);
    
} catch(Exception $e) {
    echo "Erro ao exportar: " . $e->getMessage();
}
?>