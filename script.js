// ========== FUNÇÕES GERAIS ==========

// Função para alternar entre abas
function showTab(tabName) {
    // Esconder todas as abas
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remover active de todos os botões
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar a aba selecionada
    document.getElementById(tabName).classList.add('active');
    
    // Adicionar active ao botão clicado
    event.target.classList.add('active');
    
    // Carregar dados específicos da aba
    if (tabName === 'visualizar') {
        carregarProdutos();
    } else if (tabName === 'promocoes') {
        carregarPromocoes();
        carregarCodigosPromocionais();
    } else if (tabName === 'etiquetas') {
        carregarTodosProdutosEtiquetas();
    } else if (tabName === 'faturamento') {
        carregarFaturamentoMensal();
    }
}

// ========== CADASTRO DE PRODUTOS ==========

// Gerar código automaticamente quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('Página carregada');
    carregarProdutos();
    setTimeout(gerarCodigoPreview, 100);
    
    // Adicionar fonte de código de barras
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    // Adicionar script do Chart.js
    if (!document.querySelector('script[src*="chart.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        document.head.appendChild(script);
    }
});

// Função para gerar código automático
function gerarCodigoPreview() {
    console.log('Gerando código...');
    
    fetch('gerar_codigo.php?acao=gerar')
    .then(response => response.json())
    .then(data => {
        const previewElement = document.getElementById('codigo-preview');
        const codigoElement = document.getElementById('codigo');
        
        if (data.sucesso) {
            previewElement.innerHTML = data.codigo;
            previewElement.style.color = '#27ae60';
            previewElement.style.fontWeight = 'bold';
            codigoElement.value = data.codigo;
        } else {
            previewElement.innerHTML = '❌ Erro ao gerar código';
            previewElement.style.color = '#e74c3c';
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        document.getElementById('codigo-preview').innerHTML = '❌ Erro de conexão';
    });
}

// Cadastro de Produto
document.getElementById('form-cadastro')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const codigo = document.getElementById('codigo').value;
    
    if (!codigo) {
        alert('Aguardando geração do código...');
        return;
    }
    
    const produto = {
        codigo: codigo,
        nome: document.getElementById('nome').value,
        tamanho: document.getElementById('tamanho').value,
        valor: document.getElementById('valor').value,
        quantidade: document.getElementById('quantidade').value
    };
    
    fetch('cadastrar_produto.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(produto)
    })
    .then(response => response.json())
    .then(data => {
        const mensagem = document.getElementById('mensagem-cadastro');
        
        if (data.sucesso) {
            mensagem.className = 'mensagem sucesso';
            mensagem.innerHTML = `<strong>✅ ${data.mensagem}</strong><br><small>Código: ${data.codigo_gerado}</small>`;
            document.getElementById('form-cadastro').reset();
            setTimeout(gerarCodigoPreview, 500);
        } else {
            mensagem.className = 'mensagem erro';
            mensagem.textContent = '❌ ' + (data.mensagem || 'Erro desconhecido');
        }
        
        mensagem.style.display = 'block';
        
        if (data.sucesso) {
            setTimeout(() => { mensagem.style.display = 'none'; }, 5000);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro: ' + error.message);
    });
});

// ========== BAIXA DE PRODUTOS ==========

function buscarProdutoBaixa() {
    const busca = document.getElementById('busca-baixa').value;
    
    if (!busca) {
        alert('Digite um código ou nome para buscar');
        return;
    }
    
    fetch(`buscar_produto.php?busca=${encodeURIComponent(busca)}`)
    .then(response => response.json())
    .then(data => {
        const resultado = document.getElementById('resultado-baixa');
        const formBaixa = document.getElementById('form-baixa');
        const dadosProduto = document.getElementById('dados-produto-baixa');
        
        if (data.sucesso) {
            dadosProduto.innerHTML = `
                <div class="produto-info" data-id="${data.produto.id}">
                    <p><strong>Código:</strong> ${data.produto.codigo}</p>
                    <p><strong>Nome:</strong> ${data.produto.nome}</p>
                    <p><strong>Tamanho:</strong> ${data.produto.tamanho}</p>
                    <p><strong>Valor:</strong> R$ ${parseFloat(data.produto.valor).toFixed(2)}</p>
                    <p><strong>Quantidade:</strong> ${data.produto.quantidade}</p>
                </div>
            `;
            formBaixa.style.display = 'block';
            resultado.innerHTML = '';
        } else {
            resultado.innerHTML = '<p class="erro">Produto não encontrado</p>';
            formBaixa.style.display = 'none';
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro na busca');
    });
}

function confirmarBaixa() {
    const produtoInfo = document.querySelector('#dados-produto-baixa .produto-info');
    if (!produtoInfo) return;
    
    const produtoId = produtoInfo.dataset.id;
    
    fetch('dar_baixa.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: produtoId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            alert('✅ Baixa realizada com sucesso!');
            document.getElementById('form-baixa').style.display = 'none';
            document.getElementById('busca-baixa').value = '';
            document.getElementById('resultado-baixa').innerHTML = '';
            carregarProdutos();
        } else {
            alert('❌ Erro ao dar baixa: ' + data.mensagem);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao processar baixa');
    });
}

// ========== VISUALIZAR/EDITAR PRODUTOS ==========

function carregarProdutos() {
    fetch('listar_produtos.php')
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            const tabela = document.getElementById('tabela-produtos');
            let html = `
                <table>
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Nome</th>
                            <th>Tamanho</th>
                            <th>Valor</th>
                            <th>Quantidade</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            data.produtos.forEach(produto => {
                html += `
                    <tr>
                        <td>${produto.codigo}</td>
                        <td>${produto.nome}</td>
                        <td>${produto.tamanho}</td>
                        <td>R$ ${parseFloat(produto.valor).toFixed(2)}</td>
                        <td>${produto.quantidade}</td>
                        <td>
                            <button class="action-btn edit-btn" onclick="editarProduto(${produto.id})">✏️ Editar</button>
                            <button class="action-btn delete-btn" onclick="excluirProduto(${produto.id})">🗑️ Excluir</button>
                        </td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            tabela.innerHTML = html;
        }
    })
    .catch(error => console.error('Erro:', error));
}

function buscarProdutos() {
    const busca = document.getElementById('busca-visualizar').value;
    
    if (!busca) {
        carregarProdutos();
        return;
    }
    
    fetch(`buscar_produto.php?busca=${encodeURIComponent(busca)}`)
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            const tabela = document.getElementById('tabela-produtos');
            let html = `
                <table>
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Nome</th>
                            <th>Tamanho</th>
                            <th>Valor</th>
                            <th>Quantidade</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            const produtos = [data.produto];
            
            produtos.forEach(produto => {
                html += `
                    <tr>
                        <td>${produto.codigo}</td>
                        <td>${produto.nome}</td>
                        <td>${produto.tamanho}</td>
                        <td>R$ ${parseFloat(produto.valor).toFixed(2)}</td>
                        <td>${produto.quantidade}</td>
                        <td>
                            <button class="action-btn edit-btn" onclick="editarProduto(${produto.id})">✏️ Editar</button>
                            <button class="action-btn delete-btn" onclick="excluirProduto(${produto.id})">🗑️ Excluir</button>
                        </td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            tabela.innerHTML = html;
        } else {
            alert('Produto não encontrado');
        }
    })
    .catch(error => console.error('Erro:', error));
}

function editarProduto(id) {
    fetch(`buscar_produto_id.php?id=${id}`)
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            document.getElementById('edit-id').value = data.produto.id;
            document.getElementById('edit-codigo').value = data.produto.codigo;
            document.getElementById('edit-nome').value = data.produto.nome;
            document.getElementById('edit-tamanho').value = data.produto.tamanho;
            document.getElementById('edit-valor').value = data.produto.valor;
            document.getElementById('edit-quantidade').value = data.produto.quantidade;
            
            document.getElementById('modal-editar').style.display = 'block';
        }
    })
    .catch(error => console.error('Erro:', error));
}

function fecharModal() {
    document.getElementById('modal-editar').style.display = 'none';
}

document.getElementById('form-editar')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const produto = {
        id: document.getElementById('edit-id').value,
        codigo: document.getElementById('edit-codigo').value,
        nome: document.getElementById('edit-nome').value,
        tamanho: document.getElementById('edit-tamanho').value,
        valor: document.getElementById('edit-valor').value,
        quantidade: document.getElementById('edit-quantidade').value
    };
    
    fetch('editar_produto.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(produto)
    })
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            alert('✅ Produto atualizado com sucesso!');
            fecharModal();
            carregarProdutos();
        } else {
            alert('❌ Erro ao atualizar produto');
        }
    })
    .catch(error => console.error('Erro:', error));
});

function excluirProduto(id) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        fetch('excluir_produto.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        })
        .then(response => response.json())
        .then(data => {
            if (data.sucesso) {
                alert('✅ Produto excluído com sucesso!');
                carregarProdutos();
            } else {
                alert('❌ Erro ao excluir produto');
            }
        })
        .catch(error => console.error('Erro:', error));
    }
}

// ========== PROMOÇÕES ==========

let codigoPromocionalAplicado = null;
let descontoCodigo = 0;

function mostrarSubTab(tabId) {
    document.querySelectorAll('.sub-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
    
    if (tabId === 'codigos-promocionais') {
        carregarCodigosPromocionais();
    }
}

// Toggle entre tipo de código
function toggleTipoCodigo() {
    const tipo = document.querySelector('input[name="tipo-codigo"]:checked').value;
    
    if (tipo === 'especifico') {
        document.getElementById('campo-busca-produto').style.display = 'block';
        document.getElementById('campo-valor-minimo').style.display = 'none';
        document.getElementById('resultado-produto-promo').innerHTML = '';
    } else {
        document.getElementById('campo-busca-produto').style.display = 'none';
        document.getElementById('campo-valor-minimo').style.display = 'block';
    }
    
    // Mostrar os campos de promoção quando um tipo for selecionado
    document.getElementById('campos-promocao').style.display = 'block';
}

// Também adicione no evento de clique dos radio buttons
document.querySelectorAll('input[name="tipo-codigo"]').forEach(radio => {
    radio.addEventListener('change', toggleTipoCodigo);
});

function toggleTipoDesconto() {
    const tipo = document.querySelector('input[name="tipo-desconto"]:checked').value;
    
    if (tipo === 'percentual') {
        document.getElementById('campo-percentual').style.display = 'block';
        document.getElementById('campo-valor-fixo').style.display = 'none';
        document.getElementById('desconto').required = true;
        document.getElementById('desconto-fixo').required = false;
    } else {
        document.getElementById('campo-percentual').style.display = 'none';
        document.getElementById('campo-valor-fixo').style.display = 'block';
        document.getElementById('desconto').required = false;
        document.getElementById('desconto-fixo').required = true;
    }
}
function gerarCodigoPromocional() {
    const prefixos = ['PROMO', 'DESC', 'VERAO', 'INVERNO', 'LIQUIDA', 'OFERTA', 'SUPER', 'MEGA'];
    const prefixo = prefixos[Math.floor(Math.random() * prefixos.length)];
    const numero = Math.floor(Math.random() * 900 + 100).toString();
    const codigo = prefixo + numero;
    document.getElementById('codigo-promocional').value = codigo;
}

function buscarProdutoPromocao() {
    const busca = document.getElementById('busca-produto-promo').value;
    
    if (!busca) {
        alert('Digite um código ou nome para buscar');
        return;
    }
    
    fetch(`buscar_produto.php?busca=${encodeURIComponent(busca)}`)
    .then(response => response.json())
    .then(data => {
        const resultado = document.getElementById('resultado-produto-promo');
        
        if (data.sucesso) {
            resultado.innerHTML = `
                <div class="produto-info" data-id="${data.produto.id}">
                    <p><strong>Código:</strong> ${data.produto.codigo}</p>
                    <p><strong>Nome:</strong> ${data.produto.nome}</p>
                    <p><strong>Valor atual:</strong> R$ ${parseFloat(data.produto.valor).toFixed(2)}</p>
                </div>
            `;
            // Mostrar os campos de promoção
            document.getElementById('campos-promocao').style.display = 'block';
        } else {
            resultado.innerHTML = '<p class="erro">Produto não encontrado</p>';
            document.getElementById('campos-promocao').style.display = 'none';
        }
    })
    .catch(error => console.error('Erro:', error));
}

// Criar promoção - VERSÃO ÚNICA
document.getElementById('form-promocao')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const tipoCodigo = document.querySelector('input[name="tipo-codigo"]:checked').value;
    const tipoDesconto = document.querySelector('input[name="tipo-desconto"]:checked').value;
    const nomePromocao = document.getElementById('nome-promocao').value;
    const codigoPromocional = document.getElementById('codigo-promocional').value;
    
    // Validações
    if (!nomePromocao) {
        alert('Por favor, dê um nome para a promoção');
        return;
    }
    
    if (!codigoPromocional) {
        alert('Por favor, informe ou gere um código promocional');
        return;
    }
    
    if (tipoDesconto === 'percentual') {
        const desconto = document.getElementById('desconto').value;
        if (!desconto || desconto <= 0 || desconto > 100) {
            alert('Por favor, informe um percentual de desconto válido (1-100)');
            return;
        }
    } else {
        const descontoFixo = document.getElementById('desconto-fixo').value;
        if (!descontoFixo || descontoFixo <= 0) {
            alert('Por favor, informe um valor de desconto válido');
            return;
        }
    }
    
    const dataInicio = document.getElementById('data-inicio').value;
    const dataFim = document.getElementById('data-fim').value;
    
    if (!dataInicio || !dataFim) {
        alert('Por favor, informe as datas de início e fim');
        return;
    }
    
    let produto_id = null;
    
    if (tipoCodigo === 'especifico') {
        const produtoInfo = document.querySelector('#resultado-produto-promo .produto-info');
        if (!produtoInfo) {
            alert('Busque um produto primeiro');
            return;
        }
        produto_id = produtoInfo.dataset.id;
    }
    
    const promocao = {
        nome_promocao: nomePromocao,
        produto_id: produto_id,
        tipo_codigo: tipoCodigo,
        tipo_desconto: tipoDesconto,
        desconto_percentual: tipoDesconto === 'percentual' ? document.getElementById('desconto').value : null,
        valor_desconto_fixo: tipoDesconto === 'fixo' ? document.getElementById('desconto-fixo').value : 0,
        codigo_promocional: codigoPromocional,
        valor_minimo: document.getElementById('valor-minimo').value || 0,
        data_inicio: dataInicio,
        data_fim: dataFim,
        limite_uso: document.getElementById('limite-uso').value || null
    };
    
    console.log('Enviando promoção:', promocao);
    
    fetch('criar_promocao_generica.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promocao)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Resposta:', data);
        if (data.sucesso) {
            alert(`✅ Promoção criada com sucesso!\n\nNome: ${nomePromocao}\nCódigo: ${data.codigo}`);
            
            document.getElementById('form-promocao').reset();
            document.getElementById('resultado-produto-promo').innerHTML = '';
            document.getElementById('campos-promocao').style.display = 'none';
            
            document.querySelector('input[name="tipo-codigo"][value="especifico"]').checked = true;
            document.getElementById('campo-busca-produto').style.display = 'block';
            document.getElementById('campo-valor-minimo').style.display = 'none';
            
            carregarCodigosPromocionais();
            carregarPromocoes();
        } else {
            alert('❌ Erro: ' + data.mensagem);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao criar promoção: ' + error.message);
    });
});

function carregarPromocoes() {
    fetch('listar_promocoes.php')
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            const tabela = document.getElementById('tabela-promocoes');
            let html = `
                <table>
                    <thead>
                        <tr>
                            <th>Produto</th>
                            <th>Desconto</th>
                            <th>Data Início</th>
                            <th>Data Fim</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            if (data.promocoes && data.promocoes.length > 0) {
                data.promocoes.forEach(promocao => {
                    html += `
                        <tr>
                            <td>${promocao.nome_produto}</td>
                            <td>${promocao.desconto_percentual}%</td>
                            <td>${promocao.data_inicio}</td>
                            <td>${promocao.data_fim}</td>
                            <td>
                                <button class="action-btn delete-btn" onclick="excluirPromocao(${promocao.id})">🗑️ Remover</button>
                            </td>
                        </tr>
                    `;
                });
            } else {
                html += '<tr><td colspan="5">Nenhuma promoção ativa</td></tr>';
            }
            
            html += '</tbody></table>';
            tabela.innerHTML = html;
        }
    })
    .catch(error => console.error('Erro:', error));
}

function excluirPromocao(id) {
    if (confirm('Remover esta promoção?')) {
        fetch('excluir_promocao.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        })
        .then(response => response.json())
        .then(data => {
            if (data.sucesso) {
                alert('✅ Promoção removida!');
                carregarPromocoes();
                carregarCodigosPromocionais();
            }
        });
    }
}

function carregarCodigosPromocionais() {
    fetch('listar_codigos_promocionais.php')
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            const container = document.getElementById('tabela-codigos');
            if (!container) return;
            
            let html = `
                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Código</th>
                            <th>Tipo</th>
                            <th>Desconto</th>
                            <th>Aplicável</th>
                            <th>Validade</th>
                            <th>Usos</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            if (data.codigos && data.codigos.length > 0) {
                data.codigos.forEach(codigo => {
                    const tipo = codigo.tipo_desconto === 'percentual' ? '%' : 'R$';
                    const valor = codigo.tipo_desconto === 'percentual' 
                        ? codigo.desconto_percentual + '%' 
                        : 'R$ ' + parseFloat(codigo.valor_desconto_fixo).toFixed(2);
                    
                    const aplicavel = codigo.aplicavel_todos ? 'Qualquer produto' : (codigo.nome_produto || 'Produto específico');
                    
                    const hoje = new Date();
                    const fim = new Date(codigo.data_fim);
                    const status = fim >= hoje ? '<span style="color:green; font-weight:bold;">Ativo</span>' : '<span style="color:red; font-weight:bold;">Expirado</span>';
                    
                    const usos = codigo.uso_atual || 0;
                    const limite = codigo.limite_uso ? `/${codigo.limite_uso}` : '';
                    
                    html += `
                        <tr>
                            <td><strong>${codigo.nome_promocao || 'Sem nome'}</strong></td>
                            <td><code style="background:#f0f0f0; padding:3px 6px;">${codigo.codigo_promocional}</code></td>
                            <td>${tipo}</td>
                            <td>${valor}</td>
                            <td>${aplicavel}</td>
                            <td>${new Date(codigo.data_fim).toLocaleDateString()}</td>
                            <td>${usos}${limite}</td>
                            <td>${status}</td>
                            <td>
                                <button class="action-btn delete-btn" onclick="excluirCodigoPromocional(${codigo.id})">🗑️</button>
                            </td>
                        </tr>
                    `;
                });
            } else {
                html += '<tr><td colspan="9" style="text-align:center;">Nenhum código promocional encontrado</td></tr>';
            }
            
            html += '</tbody></table>';
            container.innerHTML = html;
        }
    })
    .catch(error => console.error('Erro:', error));
}

function gerarCodigoEmMassa() {
    const quantidade = prompt('Quantos códigos deseja gerar?', '5');
    if (!quantidade) return;
    
    fetch('gerar_codigos_massa.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantidade: parseInt(quantidade) })
    })
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            alert(`✅ ${data.quantidade} códigos gerados!\n\nCódigos: ${data.codigos.join(', ')}`);
            carregarCodigosPromocionais();
        } else {
            alert('❌ Erro: ' + data.mensagem);
        }
    });
}

function excluirCodigoPromocional(id) {
    if (confirm('Excluir este código promocional?')) {
        fetch('excluir_codigo_promocional.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        })
        .then(response => response.json())
        .then(data => {
            if (data.sucesso) {
                alert('✅ Código excluído!');
                carregarCodigosPromocionais();
                carregarPromocoes();
            }
        });
    }
}

function exportarCodigos() {
    window.location.href = 'exportar_codigos.php';
}

function recarregarCodigos() {
    carregarCodigosPromocionais();
}

// ========== CARRINHO E PAGAMENTO ==========

let carrinho = [];

function buscarProdutoPagamento() {
    const busca = document.getElementById('busca-pagamento').value;
    
    if (!busca) {
        alert('Digite um código ou nome para buscar');
        return;
    }
    
    fetch(`buscar_produto.php?busca=${encodeURIComponent(busca)}`)
    .then(response => response.json())
    .then(data => {
        const resultado = document.getElementById('resultado-pagamento');
        
        if (data.sucesso) {
            resultado.innerHTML = `
                <div class="produto-info">
                    <p><strong>Código:</strong> ${data.produto.codigo}</p>
                    <p><strong>Nome:</strong> ${data.produto.nome}</p>
                    <p><strong>Tamanho:</strong> ${data.produto.tamanho}</p>
                    <p><strong>Valor:</strong> R$ ${parseFloat(data.produto.valor).toFixed(2)}</p>
                    <p><strong>Quantidade:</strong> ${data.produto.quantidade}</p>
                    <button onclick="adicionarAoCarrinho(${JSON.stringify(data.produto).replace(/"/g, '&quot;')})" class="btn-success">
                        ➕ Adicionar ao Carrinho
                    </button>
                </div>
            `;
        } else {
            resultado.innerHTML = '<p class="erro">Produto não encontrado</p>';
        }
    })
    .catch(error => console.error('Erro:', error));
}

function adicionarAoCarrinho(produto) {
    const quantidade = prompt('Quantidade desejada:', '1');
    
    if (quantidade && parseInt(quantidade) > 0 && parseInt(quantidade) <= produto.quantidade) {
        fetch(`verificar_promocao_produto.php?produto_id=${produto.id}`)
        .then(response => response.json())
        .then(data => {
            if (data.sucesso && data.promocao) {
                produto.promocao = data.promocao;
            }
            
            const existente = carrinho.find(item => item.id === produto.id);
            
            if (existente) {
                existente.quantidade_carrinho += parseInt(quantidade);
                if (data.promocao) existente.promocao = data.promocao;
            } else {
                carrinho.push({
                    ...produto,
                    quantidade_carrinho: parseInt(quantidade),
                    promocao: data.promocao || null
                });
            }
            
            atualizarCarrinho();
            document.getElementById('busca-pagamento').value = '';
            document.getElementById('resultado-pagamento').innerHTML = '';
        });
    } else {
        alert('Quantidade inválida ou insuficiente em estoque!');
    }
}

function atualizarCarrinho() {
    const container = document.getElementById('itens-carrinho');
    let html = '';
    let subtotal = 0;
    let descontosPromocao = 0;
    
    carrinho.forEach((item, index) => {
        const precoOriginal = item.valor * item.quantidade_carrinho;
        subtotal += precoOriginal;
        
        let precoFinal = precoOriginal;
        let descontoTexto = '';
        
        if (item.promocao) {
            if (item.promocao.tipo_desconto === 'percentual') {
                const desconto = precoOriginal * (item.promocao.desconto_percentual / 100);
                precoFinal = precoOriginal - desconto;
                descontosPromocao += desconto;
                descontoTexto = `<span style="color:#e74c3c;"> (-${item.promocao.desconto_percentual}%)</span>`;
            } else {
                const desconto = item.promocao.valor_desconto_fixo * item.quantidade_carrinho;
                precoFinal = precoOriginal - desconto;
                descontosPromocao += desconto;
                descontoTexto = `<span style="color:#e74c3c;"> (-R$ ${item.promocao.valor_desconto_fixo.toFixed(2)})</span>`;
            }
        }
        
        html += `
            <div class="item-carrinho">
                <div>
                    <strong>${item.nome}</strong> - Tam: ${item.tamanho}<br>
                    Quantidade: ${item.quantidade_carrinho} x R$ ${parseFloat(item.valor).toFixed(2)}${descontoTexto}
                </div>
                <div>
                    <strong>R$ ${precoFinal.toFixed(2)}</strong>
                    <button onclick="removerDoCarrinho(${index})" class="delete-btn" style="margin-left:10px;">🗑️</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html || '<p>Carrinho vazio</p>';
    
    const total = subtotal - descontosPromocao - descontoCodigo;
    
    document.getElementById('subtotal-carrinho').innerHTML = `R$ ${subtotal.toFixed(2)}`;
    document.getElementById('descontos-carrinho').innerHTML = `R$ ${descontosPromocao.toFixed(2)}`;
    
    if (descontoCodigo > 0) {
        document.getElementById('desconto-codigo').style.display = 'flex';
        document.getElementById('valor-desconto-codigo').innerHTML = `R$ ${descontoCodigo.toFixed(2)}`;
    } else {
        document.getElementById('desconto-codigo').style.display = 'none';
    }
    
    document.getElementById('total-carrinho').innerHTML = `R$ ${total.toFixed(2)}`;
}

function removerDoCarrinho(index) {
    carrinho.splice(index, 1);
    atualizarCarrinho();
}

function aplicarCodigoPromocional() {
    const codigo = document.getElementById('codigo-promo-pagamento').value;
    
    if (!codigo) {
        document.getElementById('mensagem-codigo').innerHTML = 'Digite um código';
        document.getElementById('mensagem-codigo').className = 'mensagem-codigo erro';
        return;
    }
    
    fetch(`validar_codigo_promocional.php?codigo=${encodeURIComponent(codigo)}`)
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            codigoPromocionalAplicado = data.promocao;
            
            if (codigoPromocionalAplicado && carrinho.length > 0) {
                // Calcular desconto baseado no primeiro item
                const primeiroItem = carrinho[0];
                
                if (codigoPromocionalAplicado.tipo_desconto === 'percentual') {
                    descontoCodigo = (primeiroItem.valor * primeiroItem.quantidade_carrinho) * 
                                    (codigoPromocionalAplicado.desconto_percentual / 100);
                } else {
                    // Verificar se o desconto fixo não é maior que o valor do item
                    const valorItem = primeiroItem.valor * primeiroItem.quantidade_carrinho;
                    descontoCodigo = Math.min(codigoPromocionalAplicado.valor_desconto_fixo * primeiroItem.quantidade_carrinho, valorItem);
                }
            }
            
            atualizarCarrinho();
            
            document.getElementById('mensagem-codigo').innerHTML = `✅ ${data.mensagem}`;
            document.getElementById('mensagem-codigo').className = 'mensagem-codigo sucesso';
        } else {
            codigoPromocionalAplicado = null;
            descontoCodigo = 0;
            atualizarCarrinho();
            
            document.getElementById('mensagem-codigo').innerHTML = '❌ ' + data.mensagem;
            document.getElementById('mensagem-codigo').className = 'mensagem-codigo erro';
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        document.getElementById('mensagem-codigo').innerHTML = '❌ Erro ao validar código';
        document.getElementById('mensagem-codigo').className = 'mensagem-codigo erro';
    });
}

function finalizarVenda() {
    const formaPagamento = document.getElementById('forma-pagamento').value;
    const nomeCliente = document.getElementById('nome-cliente').value;
    
    if (carrinho.length === 0) {
        alert('Carrinho vazio!');
        return;
    }
    
    if (!formaPagamento) {
        alert('Selecione uma forma de pagamento!');
        return;
    }
    
    // Calcular descontos das promoções automáticas
    let descontosPromocao = 0;
    carrinho.forEach(item => {
        if (item.promocao) {
            if (item.promocao.tipo_desconto === 'percentual') {
                descontosPromocao += (item.valor * item.quantidade_carrinho) * (item.promocao.desconto_percentual / 100);
            } else {
                descontosPromocao += item.promocao.valor_desconto_fixo * item.quantidade_carrinho;
            }
        }
    });
    
const venda = {
    itens: carrinho,
    forma_pagamento: formaPagamento,
    nome_cliente: nomeCliente || 'Cliente não identificado',
    codigo_promocional: codigoPromocionalAplicado?.codigo_promocional || null,
    desconto_codigo: descontoCodigo || 0
};
    
    console.log('Enviando venda:', venda); // Para debug
    
    fetch('finalizar_venda.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(venda)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Resposta:', data); // Para debug
        if (data.sucesso) {
            alert(`✅ Venda finalizada!\nTotal: R$ ${data.total.toFixed(2)}\nDescontos: R$ ${data.desconto_total.toFixed(2)}`);
            carrinho = [];
            codigoPromocionalAplicado = null;
            descontoCodigo = 0;
            atualizarCarrinho();
            document.getElementById('forma-pagamento').value = '';
            document.getElementById('nome-cliente').value = '';
            document.getElementById('codigo-promo-pagamento').value = '';
            document.getElementById('desconto-codigo').style.display = 'none';
            carregarProdutos();
            
            // Atualizar faturamento se a aba estiver ativa
            if (document.getElementById('faturamento').classList.contains('active')) {
                carregarFaturamentoMensal();
            }
        } else {
            alert('❌ Erro: ' + data.mensagem);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao processar venda');
    });
}

function filtrarEtiquetas() {
    const filtroTodos = document.getElementById('filtro-todos').checked;
    const filtroPromocao = document.getElementById('filtro-promocao').checked;
    
    if (filtroTodos) {
        exibirEtiquetas(produtosEtiquetas);
    } else if (filtroPromocao) {
        fetch('listar_promocoes.php')
        .then(response => response.json())
        .then(data => {
            if (data.sucesso) {
                const idsPromocao = data.promocoes.map(p => p.produto_id);
                const produtosFiltrados = produtosEtiquetas.filter(p => idsPromocao.includes(p.id));
                exibirEtiquetas(produtosFiltrados);
            }
        });
    }
}

function exibirEtiquetas(produtos) {
    const grid = document.getElementById('resultado-etiquetas');
    let html = '';
    
    produtos.forEach(produto => {
        const selecionada = etiquetasSelecionadas.includes(produto.id);
        html += `
            <div class="etiqueta-card ${selecionada ? 'selecionada' : ''}" onclick="selecionarEtiqueta(${produto.id})">
                <input type="checkbox" ${selecionada ? 'checked' : ''} 
                       onchange="toggleSelecionarEtiqueta(${produto.id})" onclick="event.stopPropagation()">
                <div class="etiqueta-conteudo">
                    <div class="codigo-barras">*${produto.codigo}*</div>
                    <div class="etiqueta-nome">${produto.nome}</div>
                    <div class="etiqueta-tamanho">Tam: ${produto.tamanho}</div>
                    <div class="etiqueta-preco">R$ ${parseFloat(produto.valor).toFixed(2)}</div>
                </div>
                <button class="edit-btn" style="margin-top:10px; width:100%;" 
                        onclick="abrirModalEtiqueta(${produto.id}); event.stopPropagation()">
                    ✏️ Personalizar
                </button>
            </div>
        `;
    });
    
    grid.innerHTML = html || '<p style="text-align:center;">Nenhum produto encontrado</p>';
}

function selecionarEtiqueta(id) {
    const index = etiquetasSelecionadas.indexOf(id);
    if (index === -1) {
        etiquetasSelecionadas.push(id);
    } else {
        etiquetasSelecionadas.splice(index, 1);
    }
    exibirEtiquetas(produtosEtiquetas);
}

function toggleSelecionarEtiqueta(id) {
    selecionarEtiqueta(id);
}

function limparBuscaEtiqueta() {
    document.getElementById('busca-etiqueta').value = '';
    carregarTodosProdutosEtiquetas();
}

function abrirModalEtiqueta(id) {
    fetch(`buscar_produto_id.php?id=${id}`)
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            const produto = data.produto;
            
            document.getElementById('etiqueta-produto-id').value = produto.id;
            document.getElementById('etiqueta-codigo').value = produto.codigo;
            document.getElementById('etiqueta-nome').value = produto.nome;
            document.getElementById('etiqueta-tamanho').value = produto.tamanho;
            document.getElementById('etiqueta-valor').value = produto.valor;
            document.getElementById('etiqueta-valor-promo').value = '';
            document.getElementById('etiqueta-mostrar-promo').checked = false;
            document.getElementById('etiqueta-texto-extra').value = '';
            document.getElementById('etiqueta-cor').value = '#ffffff';
            
            atualizarPreviewEtiqueta();
            document.getElementById('modal-etiqueta').style.display = 'block';
        }
    });
}

function atualizarPreviewEtiqueta() {
    const codigo = document.getElementById('etiqueta-codigo').value;
    const nome = document.getElementById('etiqueta-nome').value;
    const tamanho = document.getElementById('etiqueta-tamanho').value;
    const valor = document.getElementById('etiqueta-valor').value;
    const valorPromo = document.getElementById('etiqueta-valor-promo').value;
    const mostrarPromo = document.getElementById('etiqueta-mostrar-promo').checked;
    const textoExtra = document.getElementById('etiqueta-texto-extra').value;
    const cor = document.getElementById('etiqueta-cor').value;
    
    let precoHtml = '';
    if (mostrarPromo && valorPromo) {
        precoHtml = `
            <div class="etiqueta-preco-promo">De: R$ ${parseFloat(valor).toFixed(2)}</div>
            <div class="etiqueta-preco">Por: R$ ${parseFloat(valorPromo).toFixed(2)}</div>
        `;
    } else {
        precoHtml = `<div class="etiqueta-preco">R$ ${parseFloat(valor).toFixed(2)}</div>`;
    }
    
    const preview = `
        <div class="preview-conteudo" style="background: ${cor};">
            <div class="codigo-barras-preview">*${codigo}*</div>
            <div class="etiqueta-nome">${nome}</div>
            <div class="etiqueta-tamanho">Tamanho: ${tamanho}</div>
            ${precoHtml}
            ${textoExtra ? `<div class="etiqueta-texto-extra">${textoExtra}</div>` : ''}
        </div>
    `;
    
    document.getElementById('etiqueta-preview').innerHTML = preview;
}

function fecharModalEtiqueta() {
    document.getElementById('modal-etiqueta').style.display = 'none';
}

function salvarEtiqueta() {
    alert('Personalização salva!');
}

function imprimirEtiquetaUnica() {
    const preview = document.querySelector('.preview-conteudo').cloneNode(true);
    const janela = window.open('', '_blank');
    
    janela.document.write(`
        <html>
            <head>
                <title>Etiqueta</title>
                <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
                <style>
                    body { display: flex; justify-content: center; align-items: center; height: 100vh; }
                    .preview-conteudo { width: 300px; padding: 20px; text-align: center; }
                    .codigo-barras-preview { font-family: 'Libre Barcode 39', cursive; font-size: 48px; }
                    .etiqueta-preco { font-size: 20px; color: #27ae60; font-weight: bold; }
                </style>
            </head>
            <body>${preview.outerHTML}</body>
        </html>
    `);
    
    janela.document.close();
    setTimeout(() => janela.print(), 500);
}

function imprimirEtiquetasSelecionadas() {
    if (etiquetasSelecionadas.length === 0) {
        alert('Selecione pelo menos uma etiqueta');
        return;
    }
    
    const selecionados = produtosEtiquetas.filter(p => etiquetasSelecionadas.includes(p.id));
    imprimirMultiplasEtiquetas(selecionados);
}

function imprimirTodasEtiquetas() {
    imprimirMultiplasEtiquetas(produtosEtiquetas);
}

function imprimirMultiplasEtiquetas(produtos) {
    let html = `
        <html>
            <head>
                <title>Etiquetas</title>
                <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
                <style>
                    body { padding: 20px; }
                    .etiquetas-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
                    .etiqueta-card { border: 1px solid #000; padding: 10px; text-align: center; }
                </style>
            </head>
            <body>
                <div class="etiquetas-grid">
    `;
    
    produtos.forEach(p => {
        html += `
            <div class="etiqueta-card">
                <div class="codigo-barras">*${p.codigo}*</div>
                <div><strong>${p.nome}</strong></div>
                <div>Tam: ${p.tamanho}</div>
                <div class="etiqueta-preco">R$ ${parseFloat(p.valor).toFixed(2)}</div>
            </div>
        `;
    });
    
    html += '</div></body></html>';
    
    const janela = window.open('', '_blank');
    janela.document.write(html);
    janela.document.close();
    setTimeout(() => janela.print(), 500);
}

function exportarEtiquetasPDF() {
    alert('Use a opção de impressão e escolha "Salvar como PDF"');
}

// ========== FATURAMENTO ==========

function formatarData(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

function carregarFaturamentoMensal() {
    document.getElementById('faturamento-personalizado').style.display = 'none';
    
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    document.getElementById('data-inicio-faturamento').value = formatarData(primeiroDia);
    document.getElementById('data-fim-faturamento').value = formatarData(hoje);
    
    fetch('faturamento.php?acao=mensal')
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            atualizarCardsFaturamento(data.dados);
            carregarFormasPagamento();
            carregarUltimasVendas();
            buscarFaturamentoPeriodo();
        }
    })
    .catch(error => console.error('Erro:', error));
}

function carregarFaturamentoAnual() {
    document.getElementById('faturamento-personalizado').style.display = 'none';
    
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), 0, 1);
    document.getElementById('data-inicio-faturamento').value = formatarData(primeiroDia);
    document.getElementById('data-fim-faturamento').value = formatarData(hoje);
    
    fetch('faturamento.php?acao=anual')
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            let totalVendas = 0, totalDescontos = 0, totalVendasCount = 0;
            
            if (data.meses && data.meses.length > 0) {
                data.meses.forEach(mes => {
                    totalVendas += parseFloat(mes.total_vendas || 0);
                    totalDescontos += parseFloat(mes.total_descontos || 0);
                    totalVendasCount += parseInt(mes.quantidade_vendas || 0);
                });
            }
            
            atualizarCardsFaturamento({
                total_vendas: totalVendas,
                total_descontos: totalDescontos,
                quantidade_vendas: totalVendasCount
            });
            
            if (data.meses && data.meses.length > 0) {
                criarGraficoMensal(data.meses);
            }
            
            carregarFormasPagamento();
            carregarUltimasVendas();
        }
    })
    .catch(error => console.error('Erro:', error));
}

function carregarFaturamentoPersonalizado() {
    const div = document.getElementById('faturamento-personalizado');
    
    if (div.style.display === 'none' || div.style.display === '') {
        div.style.display = 'block';
        
        const hoje = new Date();
        const trintaDiasAtras = new Date(hoje);
        trintaDiasAtras.setDate(hoje.getDate() - 30);
        
        document.getElementById('data-inicio-faturamento').value = formatarData(trintaDiasAtras);
        document.getElementById('data-fim-faturamento').value = formatarData(hoje);
    } else {
        div.style.display = 'none';
    }
}

function buscarFaturamentoPeriodo() {
    const dataInicio = document.getElementById('data-inicio-faturamento').value;
    const dataFim = document.getElementById('data-fim-faturamento').value;
    
    if (!dataInicio || !dataFim) {
        alert('Selecione as datas');
        return;
    }
    
    fetch(`faturamento.php?acao=periodo&data_inicio=${dataInicio}&data_fim=${dataFim}`)
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            let totalVendas = 0, totalDescontos = 0, totalVendasCount = 0;
            
            if (data.vendas && data.vendas.length > 0) {
                data.vendas.forEach(venda => {
                    totalVendas += parseFloat(venda.total || 0);
                    totalDescontos += parseFloat(venda.descontos || 0);
                    totalVendasCount += parseInt(venda.vendas || 0);
                });
            }
            
            atualizarCardsFaturamento({
                total_vendas: totalVendas,
                total_descontos: totalDescontos,
                quantidade_vendas: totalVendasCount
            });
            
            if (data.vendas && data.vendas.length > 0) {
                criarGraficoPeriodo(data.vendas);
            } else {
                const canvas = document.getElementById('grafico-vendas');
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            
            carregarFormasPagamento();
        }
    })
    .catch(error => console.error('Erro:', error));
}

function carregarFormasPagamento() {
    const dataInicio = document.getElementById('data-inicio-faturamento').value;
    const dataFim = document.getElementById('data-fim-faturamento').value;
    
    if (!dataInicio || !dataFim) return;
    
    fetch(`faturamento.php?acao=formas_pagamento&data_inicio=${dataInicio}&data_fim=${dataFim}`)
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            const tbody = document.querySelector('#tabela-formas-pagamento tbody');
            if (!tbody) return;
            
            let html = '';
            
            if (data.dados && data.dados.length > 0) {
                data.dados.forEach(item => {
                    html += `
                        <tr>
                            <td>${item.forma_pagamento || '-'}</td>
                            <td>${item.quantidade || 0}</td>
                            <td>R$ ${parseFloat(item.total || 0).toFixed(2)}</td>
                        </tr>
                    `;
                });
            } else {
                html = '<tr><td colspan="3">Nenhuma venda no período</td></tr>';
            }
            
            tbody.innerHTML = html;
        }
    })
    .catch(error => console.error('Erro:', error));
}

function carregarUltimasVendas() {
    fetch('listar_ultimas_vendas.php')
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            const tbody = document.querySelector('#tabela-ultimas-vendas tbody');
            if (!tbody) return;
            
            let html = '';
            
            if (data.vendas && data.vendas.length > 0) {
                data.vendas.forEach(venda => {
                    const dataVenda = new Date(venda.data_venda).toLocaleDateString('pt-BR');
                    html += `
                        <tr>
                            <td>${dataVenda}</td>
                            <td>${venda.nome_produto || '-'}</td>
                            <td>${venda.nome_cliente || '-'}</td>
                            <td>R$ ${parseFloat(venda.valor_com_desconto || 0).toFixed(2)}</td>
                            <td>${venda.forma_pagamento || '-'}</td>
                        </tr>
                    `;
                });
            } else {
                html = '<tr><td colspan="5">Nenhuma venda recente</td></tr>';
            }
            
            tbody.innerHTML = html;
        }
    })
    .catch(error => console.error('Erro:', error));
}

function atualizarCardsFaturamento(dados) {
    document.getElementById('total-vendas').innerHTML = `R$ ${parseFloat(dados.total_vendas || 0).toFixed(2)}`;
    document.getElementById('total-descontos').innerHTML = `R$ ${parseFloat(dados.total_descontos || 0).toFixed(2)}`;
    document.getElementById('numero-vendas').innerHTML = dados.quantidade_vendas || 0;
    
    const ticketMedio = dados.quantidade_vendas > 0 
        ? (dados.total_vendas / dados.quantidade_vendas).toFixed(2) 
        : '0,00';
    document.getElementById('ticket-medio').innerHTML = `R$ ${ticketMedio}`;
}

function criarGraficoMensal(meses) {
    const canvas = document.getElementById('grafico-vendas');
    if (!canvas || !window.Chart) return;
    
    if (window.meuGrafico) window.meuGrafico.destroy();
    
    const ctx = canvas.getContext('2d');
    const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const labels = meses.map(m => nomes[parseInt(m.mes) - 1] || m.mes);
    const dados = meses.map(m => parseFloat(m.total_vendas || 0));
    
    window.meuGrafico = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Vendas por Mês',
                data: dados,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52,152,219,0.1)',
                fill: true
            }]
        }
    });
}

function criarGraficoPeriodo(vendas) {
    const canvas = document.getElementById('grafico-vendas');
    if (!canvas || !window.Chart) return;
    
    if (window.meuGrafico) window.meuGrafico.destroy();
    
    const ctx = canvas.getContext('2d');
    const labels = vendas.map(v => {
        const d = v.data.split('-');
        return `${d[2]}/${d[1]}`;
    });
    const dados = vendas.map(v => parseFloat(v.total || 0));
    
    window.meuGrafico = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Vendas por Dia',
                data: dados,
                backgroundColor: '#27ae60'
            }]
        }
    });
}