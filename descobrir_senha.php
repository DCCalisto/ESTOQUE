<?php
header('Content-Type: text/html; charset=utf-8');
echo "<h2>🔍 Diagnóstico de Conexão MySQL</h2>";

// 1. Primeiro, verificar se o MySQL está rodando
echo "<h3>1. Verificando serviços MySQL:</h3>";
$mysql_socket = @fsockopen('localhost', 3306, $errno, $errstr, 5);
if ($mysql_socket) {
    echo "<p style='color:green'>✅ MySQL está rodando na porta 3306</p>";
    fclose($mysql_socket);
} else {
    echo "<p style='color:orange'>⚠️ MySQL não responde na porta 3306: $errstr</p>";
    
    // Testar porta alternativa
    $mysql_socket2 = @fsockopen('localhost', 3307, $errno, $errstr, 5);
    if ($mysql_socket2) {
        echo "<p style='color:green'>✅ MySQL está rodando na porta 3307</p>";
        fclose($mysql_socket2);
    } else {
        echo "<p style='color:red'>❌ MySQL não está respondendo em nenhuma porta comum</p>";
    }
}

// 2. Lista de possíveis combinações
echo "<h3>2. Testando combinações de usuário/senha:</h3>";

$combinacoes = [
    // Usuário root com várias senhas possíveis
    ['user' => 'root', 'pass' => '', 'desc' => 'root sem senha'],
    ['user' => 'root', 'pass' => 'root', 'desc' => 'root/root'],
    ['user' => 'root', 'pass' => '123456', 'desc' => 'root/123456'],
    ['user' => 'root', 'pass' => 'password', 'desc' => 'root/password'],
    ['user' => 'root', 'pass' => 'admin', 'desc' => 'root/admin'],
    ['user' => 'root', 'pass' => 'mysql', 'desc' => 'root/mysql'],
    ['user' => 'root', 'pass' => ' ', 'desc' => 'root/espaço'],
    
    // Outros usuários comuns
    ['user' => 'admin', 'pass' => '', 'desc' => 'admin sem senha'],
    ['user' => 'admin', 'pass' => 'admin', 'desc' => 'admin/admin'],
    ['user' => 'user', 'pass' => '', 'desc' => 'user sem senha'],
    ['user' => 'usuario', 'pass' => '', 'desc' => 'usuario sem senha'],
    
    // Usuário com @localhost
    ['user' => 'root@localhost', 'pass' => '', 'desc' => 'root@localhost'],
];

foreach($combinacoes as $teste) {
    echo "<p><strong>Testando:</strong> {$teste['desc']} </p>";
    
    try {
        // Tenta conectar sem especificar banco primeiro
        $pdo = new PDO("mysql:host=localhost;charset=utf8", $teste['user'], $teste['pass']);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        echo "<p style='color:green; margin-left:20px'>✅ CONECTOU! </p>";
        
        // Verifica se o banco estoque_roupas existe
        $bancos = $pdo->query("SHOW DATABASES LIKE 'estoque_roupas'")->fetchAll();
        if (count($bancos) > 0) {
            echo "<p style='color:green; margin-left:40px'>✅ Banco 'estoque_roupas' existe</p>";
            
            // Salva a combinação que funcionou
            echo "<p style='background:#d4edda; padding:10px; border-radius:5px;'>";
            echo "<strong>✅ SENHA CORRETA ENCONTRADA!</strong><br>";
            echo "Usuário: <strong>{$teste['user']}</strong><br>";
            echo "Senha: <strong>" . ($teste['pass'] === '' ? '(vazia)' : $teste['pass']) . "</strong><br>";
            echo "Use esta combinação no config.php";
            echo "</p>";
        } else {
            echo "<p style='color:orange; margin-left:40px'>⚠️ Banco 'estoque_roupas' não existe</p>";
        }
        
    } catch(PDOException $e) {
        echo "<p style='color:red; margin-left:20px'>❌ Erro: " . $e->getMessage() . "</p>";
    }
    
    echo "<hr>";
}

// 3. Instruções finais
echo "<h3>3. Próximos passos:</h3>";
echo "<ol>";
echo "<li>Se encontrou uma combinação que funciona, use-a no config.php</li>";
echo "<li>Se não encontrou, verifique se o MySQL está rodando no XAMPP2</li>";
echo "<li>Abra o phpMyAdmin e tente acessar: <a href='http://localhost/phpmyadmin' target='_blank'>http://localhost/phpmyadmin</a></li>";
echo "<li>No phpMyAdmin, veja qual usuário e senha funcionam</li>";
echo "</ol>";
?>