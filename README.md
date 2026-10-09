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

O cliente mantém a sessão no navegador, renova tokens automaticamente e detecta sessões retornadas pela URL. A tela principal informa se o cliente está configurado e consegue verificar a sessão de autenticação.

As operações do domínio ainda permanecem em memória porque o projeto não possui estrutura de tabelas e políticas de segurança definida. Para persistir esses dados, será necessário criar no Supabase o modelo de dados correspondente ao negócio e suas políticas RLS antes de adicionar as consultas de vendas, estoque, mesas, pagamentos, trocas e caixa.