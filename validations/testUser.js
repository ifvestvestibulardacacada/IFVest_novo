const { userSchemas } = require('./schemas');

const { runTest } = require('./test');


// Testes para userSchemas
console.log('\n=== Testes para userSchemas ===');
runTest(
  'Edição de usuário válida',
  userSchemas.edit,
  {
    nome: 'Maria Silva',
    email: 'maria@example.com',
    novasenha: 'Xyz12345'
  },
  true
);
runTest(
  'Edição de usuário com senha fraca',
  userSchemas.edit,
  {
    nome: 'Maria Silva',
    novasenha: '123'
  },
  false
);
runTest(
  'Edição com apenas nome preenchido',
  userSchemas.edit,
  {
    nome: 'Maria Silva'
  },
  true
);
runTest(
  'Edição com todos os campos ausentes',
  userSchemas.edit,
  {},
  true
);
runTest(
  'Edição com novasenha com caracteres especiais',
  userSchemas.edit,
  {
    novasenha: 'Abcd!@#123'
  },
  true
);
runTest(
  'Edição com novasenha curta',
  userSchemas.edit,
  {
    novasenha: 'Ab1'
  },
  false
);