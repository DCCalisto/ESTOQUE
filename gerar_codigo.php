<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

function gerarCodigoProduto($pdo) {
    try {
        $anoAtual = date('Y');
        
        // Buscar último número do ano
        $sql = "SELECT ultimo_numero FROM sequencia_codigos 
                WHERE prefixo = 'PROD' AND ano = :ano FOR UPDATE";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':ano' => $anoAtual]);
        $sequencia = $stmt->fetch();
        
        if ($sequencia) {
            $novoNumero = $sequencia['ultimo_numero'] + 1;
            $sql = "UPDATE sequencia_codigos SET ultimo_numero = :numero 
                    WHERE prefixo = 'PROD' AND ano = :ano";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':numero' => $novoNumero,
                ':ano' => $anoAtual
            ]);
        } else {
            $novoNumero = 1;
            $sql = "INSERT INTO sequencia_codigos (prefixo, ultimo_numero, ano) 
                    VALUES ('PROD', :numero, :ano)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':numero' => $novoNumero,
                ':ano' => $anoAtual
            ]);
        }
        
        return 'PROD-' . $anoAtual . '-' . str_pad($novoNumero, 4, '0', STR_PAD_LEFT);
        
    } catch(Exception $e) {
        error_log("Erro ao gerar código: " . $e->getMessage());
        return 'PROD-' . date('Y') . '-' . rand(1000, 9999);
    }
}

if (isset($_GET['acao']) && $_GET['acao'] === 'gerar') {
    $codigo = gerarCodigoProduto($pdo);
    echo json_encode(['sucesso' => true, 'codigo' => $codigo]);
    exit;
}

echo json_encode(['sucesso' => false, 'mensagem' => 'Ação inválida']);
?>