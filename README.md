# lovable-alex

## Configuração do Supabase

O projeto já possui um cliente Supabase preparado em `src/lib/supabase.ts`. Configure as variáveis de ambiente do Vite antes de executar a aplicação:

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

O cliente mantém a sessão no navegador, renova tokens automaticamente e detecta sessões retornadas pela URL. As operações de persistência devem ser adicionadas quando as tabelas e políticas de segurança do projeto Supabase forem definidas.
