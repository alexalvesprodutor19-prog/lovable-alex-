# lovable-alex

## Configuração do Supabase

O projeto possui um cliente Supabase integrado em `src/lib/supabase.ts` e a aplicação verifica automaticamente a configuração e a sessão no painel principal.

Configure as variáveis de ambiente do Vite antes de executar a aplicação:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
```

Também é aceito o nome legado `VITE_SUPABASE_ANON_KEY` no lugar de `VITE_SUPABASE_PUBLISHABLE_KEY`.

A chave deve ser uma chave pública do projeto. Chaves secretas ou de serviço não devem ser incluídas no frontend.

Depois de configurar as variáveis, execute:

```bash
npm install
npm run dev
```

O cliente mantém a sessão no navegador, renova tokens automaticamente e detecta sessões retornadas pela URL.

## Estrutura compartilhada de dados

O arquivo `supabase/schema.sql` contém a estrutura inicial para aplicar no SQL Editor do Supabase. Ele cria:

- empresas e perfis de usuários vinculados ao cadastro de autenticação;
- produtos e estoque compartilhado;
- mesas, pedidos e itens de pedidos;
- vendas e itens de vendas;
- pagamentos com chave de idempotência;
- trocas e diferenças financeiras;
- movimentações de caixa;
- índices, validações, gatilho de atualização e políticas RLS por empresa.

Para aplicar a estrutura:

1. Crie ou abra um projeto no Supabase.
2. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no ambiente do app.
3. Abra o SQL Editor do Supabase.
4. Cole o conteúdo de `supabase/schema.sql` e execute uma única vez.
5. Crie uma conta pelo Supabase Auth; o gatilho criará automaticamente uma empresa e um perfil administrador para o usuário.

As políticas RLS impedem que um usuário autenticado leia ou altere registros de outra empresa. As chaves de idempotência em pedidos, vendas, pagamentos, trocas e caixa devem ser preenchidas pelo fluxo da aplicação para evitar gravações duplicadas após clique repetido ou resultado incerto.

A interface atual ainda mantém os dados operacionais em memória. Depois de aplicar o schema, os handlers da tela principal precisam substituir os estados locais pelas consultas ao Supabase e executar as operações críticas em funções transacionais ou RPCs para que vendas, estoque, pagamentos, trocas e caixa sejam confirmados de forma atômica.
