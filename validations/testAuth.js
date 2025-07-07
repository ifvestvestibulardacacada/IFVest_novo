const { authSchemas } = require('./schemas');
const {runTest} = require('./test');
// Função auxiliar para executar e exibir resultados dos testes

console.log('=== Testes para authSchemas ===');

runTest(
  'Login válido',
  authSchemas.login,
  { usuario: 'teste123', senha: 'Abcd1234' },
  true
);
runTest(
  'Login com SQL Injection',
  authSchemas.login,
  { usuario: 'teste; DROP TABLE users', senha: 'Abcd1234' },
  false
);
runTest(
  'Cadastro válido',
  authSchemas.cadastro,
  {
    nome: 'João Silva',
    usuario: 'joao.silva',
    senha: 'Abcd1234',
    email: 'joao@example.com',
    perfil: 'USUARIO'
  },
  true
);
runTest(
  'Cadastro com senha fraca',
  authSchemas.cadastro,
  {
    nome: 'João Silva',
    usuario: 'joao.silva',
    senha: 'abc',
    email: 'joao@example.com',
    perfil: 'USUARIO'
  },
  false
);
runTest(
  'Login com usuário de 3 caracteres',
  authSchemas.login,
  { usuario: 'abc', senha: 'Abcd1234' },
  true
);
runTest(
  'Login com usuário vazio',
  authSchemas.login,
  { usuario: '', senha: 'Abcd1234' },
  false
);
runTest(
  'Cadastro com nome de 100 caracteres',
  authSchemas.cadastro,
  {
    nome: 'a'.repeat(100),
    usuario: 'joao.silva',
    senha: 'Abcd1234',
    email: 'joao@example.com',
    perfil: 'USUARIO'
  },
  true
);
runTest(
  'Cadastro com perfil inválido',
  authSchemas.cadastro,
  {
    nome: 'João Silva',
    usuario: 'joao.silva',
    senha: 'Abcd1234',
    email: 'joao@example.com',
    perfil: 'ADMIN'
  },
  false
);
runTest(
  'Cadastro com email inválido',
  authSchemas.cadastro,
  {
    nome: 'João Silva',
    usuario: 'joao.silva',
    senha: 'Abcd1234',
    email: 'joao@',
    perfil: 'USUARIO'
  },
  false
);