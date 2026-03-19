<?php
header('Content-Type: application/json');
require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

// Log para debug
error_log("=== NOVA VENDA ===");
error_log("Dados recebidos: " . print_r($data, true));

try {
    $pdo->beginTransaction();
    
    $totalVenda = 0;
    $totalDesconto = 0;
    $descontoCodigoAplicado = 0;
    $primeiraVendaId = null;
    
    foreach ($data['itens'] as $item) {
        // Verificar estoque
        $sql = "SELECT * FROM produtos WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $item['id']]);
        $produto = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$produto || $produto['quantidade'] < $item['quantidade_carrinho']) {
            throw new Exception('Estoque insuficiente para o produto: ' . $item['nome']);
        }
        
        // Verificar se há promoção ativa no produto
        $sql = "SELECT * FROM promocoes WHERE produto_id = :produto_id 
                AND ativa = 1 AND data_inicio <= CURDATE() AND data_fim >= CURDATE()
                AND (codigo_promocional IS NULL OR codigo_promocional = '')";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':produto_id' => $item['id']]);
        $promocao = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $valorComDescontoProduto = $item['valor'];
        $descontoProduto = 0;
        
        // Aplicar desconto da promoção do produto
        if ($promocao) {
            if ($promocao['tipo_desconto'] === 'percentual') {
                $descontoProduto = $item['valor'] * ($promocao['desconto_percentual'] / 100);
                $valorComDescontoProduto = $item['valor'] - $descontoProduto;
            } else {
                $descontoProduto = $promocao['valor_desconto_fixo'];
                $valorComDescontoProduto = $item['valor'] - $descontoProduto;
                if ($valorComDescontoProduto < 0) $valorComDescontoProduto = 0;
            }
        }
        
        // Aplicar desconto do código promocional no primeiro item (ou ratear)
        $valorFinalItem = $valorComDescontoProduto;
        $descontoCodigoNoItem = 0;
        
        // Se for o primeiro item e tem código promocional, aplica o desconto nele
        if ($primeiraVendaId === null && isset($data['codigo_promocional']) && $data['codigo_promocional'] && $data['codigo_promocional'] !== 'null' && isset($data['desconto_codigo']) && $data['desconto_codigo'] > 0) {
            $descontoCodigoNoItem = $data['desconto_codigo'] / $item['quantidade_carrinho'];
            $valorFinalItem = $valorComDescontoProduto - $descontoCodigoNoItem;
            if ($valorFinalItem < 0) $valorFinalItem = 0;
            
            $descontoCodigoAplicado = $data['desconto_codigo'];
        }
        
        // Calcular totais por item
        $subtotalOriginal = $item['valor'] * $item['quantidade_carrinho'];
        $subtotalFinal = $valorFinalItem * $item['quantidade_carrinho'];
        $descontoTotalItem = ($item['valor'] - $valorFinalItem) * $item['quantidade_carrinho'];
        
        $totalVenda += $subtotalFinal;
        $totalDesconto += $descontoTotalItem;
        
        // Registrar venda com o valor final (já incluindo desconto do código)
        $sql = "INSERT INTO vendas (produto_id, codigo_produto, nome_produto, 
                valor_original, valor_com_desconto, desconto_aplicado, forma_pagamento, nome_cliente) 
                VALUES (:produto_id, :codigo, :nome, :valor_original, :valor_desconto, :desconto, :forma_pagamento, :nome_cliente)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':produto_id' => $item['id'],
            ':codigo' => $item['codigo'],
            ':nome' => $item['nome'],
            ':valor_original' => $item['valor'],
            ':valor_desconto' => $valorFinalItem,
            ':desconto' => $item['valor'] - $valorFinalItem,
            ':forma_pagamento' => $data['forma_pagamento'],
            ':nome_cliente' => $data['nome_cliente'] ?? ''
        ]);
        
        // Guardar o ID da primeira venda
        if ($primeiraVendaId === null) {
            $primeiraVendaId = $pdo->lastInsertId();
        }
        
        // Atualizar estoque
        $novaQuantidade = max(0, $produto['quantidade'] - $item['quantidade_carrinho']);
        $sql = "UPDATE produtos SET quantidade = :quantidade WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':quantidade' => $novaQuantidade,
            ':id' => $item['id']
        ]);
    }
    
    // Registrar uso do código promocional
    if ($descontoCodigoAplicado > 0 && $primeiraVendaId) {
        $sql = "INSERT INTO uso_codigos_promocionais (codigo_promocional, venda_id, desconto_aplicado) 
                VALUES (:codigo, :venda_id, :desconto)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':codigo' => $data['codigo_promocional'],
            ':venda_id' => $primeiraVendaId,
            ':desconto' => $descontoCodigoAplicado
        ]);
    }
    
    // Atualizar faturamento mensal
    $mes = date('n');
    $ano = date('Y');
    
    $sql = "INSERT INTO faturamento_mensal (mes, ano, total_vendas, total_descontos, quantidade_vendas) 
            VALUES (:mes, :ano, :total_vendas, :total_descontos, 1)
            ON DUPLICATE KEY UPDATE 
            total_vendas = total_vendas + :total_vendas,
            total_descontos = total_descontos + :total_descontos,
            quantidade_vendas = quantidade_vendas + 1";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':mes' => $mes,
        ':ano' => $ano,
        ':total_vendas' => $totalVenda,
        ':total_descontos' => $totalDesconto
    ]);
    
    $pdo->commit();
    
    error_log("Venda finalizada - Total: R$ $totalVenda, Descontos: R$ $totalDesconto");
    
    echo json_encode([
        'sucesso' => true,
        'total' => $totalVenda,
        'desconto_total' => $totalDesconto
    ]);
    
} catch(Exception $e) {
    $pdo->rollBack();
    error_log("Erro na venda: " . $e->getMessage());
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao processar venda: ' . $e->getMessage()]);
}
?>