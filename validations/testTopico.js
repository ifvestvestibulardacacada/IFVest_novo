const { topicoSchemas } = require('./schemas');

const { runTest } = require('./test');

console.log('\n=== Testes para topicoSchemas ===');
runTest(
  'Registro de tópico válido',
  topicoSchemas.register,
  {
    topico: 'Matemática Básica',
    areaIdTopico: '789'
  },
  true
);
runTest(
  'Edição de tópico inválida com SQL',
  topicoSchemas.edit,
  {
    id: '123',
    nome: 'Tópico; DROP TABLE topicos'
  },
  false
);

runTest(
  'Registro com tópico de 100 caracteres',
  topicoSchemas.register,
  {
    topico: 'a'.repeat(100),
    areaIdTopico: '789'
  },
  true
);
runTest(
  'Registro com áreaIdTopico com SQL Injection',
  topicoSchemas.register,
  {
    topico: 'Matemática Básica',
    areaIdTopico: '789; DROP TABLE areas'
  },
  false
);
runTest(
  'Edição com tópico vazio',
  topicoSchemas.edit,
  {
    id: '123',
    nome: ''
  },
  false
);