<?php
header('Content-Type: application/json');
require_once 'config.php';

$acao = $_GET['acao'] ?? '';

try {
    if ($acao === 'mensal') {
        // Faturamento do mês atual
        $mes = $_GET['mes'] ?? date('n');
        $ano = $_GET['ano'] ?? date('Y');
        
        $sql = "SELECT * FROM faturamento_mensal WHERE mes = :mes AND ano = :ano";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':mes' => $mes, ':ano' => $ano]);
        $faturamento = $stmt->fetch();
        
        if (!$faturamento) {
            $faturamento = [
                'total_vendas' => 0,
                'total_descontos' => 0,
                'quantidade_vendas' => 0
            ];
        }
        
        echo json_encode(['sucesso' => true, 'dados' => $faturamento]);
        
    } elseif ($acao === 'anual') {
        // Faturamento do ano
        $ano = $_GET['ano'] ?? date('Y');
        
        $sql = "SELECT * FROM faturamento_mensal WHERE ano = :ano ORDER BY mes";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':ano' => $ano]);
        $meses = $stmt->fetchAll();
        
        $totalAno = 0;
        foreach ($meses as $mes) {
            $totalAno += $mes['total_vendas'];
        }
        
        echo json_encode([
            'sucesso' => true,
            'ano' => $ano,
            'meses' => $meses,
            'total_ano' => $totalAno
        ]);
        
    } elseif ($acao === 'periodo') {
        // Faturamento por período
        $data_inicio = $_GET['data_inicio'] ?? date('Y-m-01');
        $data_fim = $_GET['data_fim'] ?? date('Y-m-d');
        
        $sql = "SELECT DATE(data_venda) as data, 
                       SUM(valor_com_desconto) as total,
                       SUM(valor_original - valor_com_desconto) as descontos,
                       COUNT(*) as vendas
                FROM vendas 
                WHERE DATE(data_venda) BETWEEN :inicio AND :fim
                GROUP BY DATE(data_venda)
                ORDER BY data DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':inicio' => $data_inicio,
            ':fim' => $data_fim
        ]);
        
        $vendas = $stmt->fetchAll();
        
        echo json_encode([
            'sucesso' => true,
            'periodo' => [
                'inicio' => $data_inicio,
                'fim' => $data_fim
            ],
            'vendas' => $vendas
        ]);
        
    } elseif ($acao === 'formas_pagamento') {
        // Vendas por forma de pagamento
        $data_inicio = $_GET['data_inicio'] ?? date('Y-m-01');
        $data_fim = $_GET['data_fim'] ?? date('Y-m-d');
        
        $sql = "SELECT forma_pagamento, 
                       COUNT(*) as quantidade,
                       SUM(valor_com_desconto) as total
                FROM vendas 
                WHERE DATE(data_venda) BETWEEN :inicio AND :fim
                GROUP BY forma_pagamento
                ORDER BY total DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':inicio' => $data_inicio,
            ':fim' => $data_fim
        ]);
        
        $formas = $stmt->fetchAll();
        
        echo json_encode(['sucesso' => true, 'dados' => $formas]);
        
    } else {
        echo json_encode(['sucesso' => false, 'mensagem' => 'Ação inválida']);
    }
    
} catch(Exception $e) {
    echo json_encode(['sucesso' => false, 'mensagem' => $e->getMessage()]);
}
?>