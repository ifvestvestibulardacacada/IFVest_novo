const { questionSchemas } = require('./schemas');
const {runTest} = require('./test');

console.log('\n=== Testes para questionSchemas ===');
runTest(
  'Registro de questão válida',
  questionSchemas.register,
  {
    id: '123',
    titulo: 'Questão de teste',
    pergunta: 'Qual é a capital do Brasil?',
    areaId: '456',
    correta: 'A',
    topicosSelecionados: ['topico1', 'topico2'],
    respostasSelecionadas: 'A) Brasília'
  },
  true
);
runTest(
  'Registro de questão com SQL Injection no título',
  questionSchemas.register,
  {
    id: '123',
    titulo: 'Questão; DROP TABLE questions',
    pergunta: 'Qual é a capital do Brasil?',
    areaId: '456',
    correta: 'A',
    topicosSelecionados: ['topico1'],
    respostasSelecionadas: 'A) Brasília'
  },
  false
);
runTest(
  'Edição de questão válida',
  questionSchemas.edit,
  {
    id: '123',
    titulo: 'Questão editada',
    pergunta: 'Qual é a capital da França?',
    areaId: '456',
    correta: 'B',
    topicosSelecionados: ['topico1'],
    respostasSelecionadas: 'B) Paris'
  },
  true
);
runTest(
  'Registro com título de 200 caracteres',
  questionSchemas.register,
  {
    id: '123',
    titulo: 'a'.repeat(200),
    pergunta: 'Qual é a capital do Brasil?',
    areaId: '456',
    correta: 'A',
    topicosSelecionados: ['topico1'],
    respostasSelecionadas: 'A) Brasília'
  },
  true
);
runTest(
  'Registro com título vazio',
  questionSchemas.register,
  {
    id: '123',
    titulo: '',
    pergunta: 'Qual é a capital do Brasil?',
    areaId: '456',
    correta: 'A',
    topicosSelecionados: ['topico1'],
    respostasSelecionadas: 'A) Brasília'
  },
  false
);
runTest(
  'Registro sem campo correta',
  questionSchemas.register,
  {
    id: '123',
    titulo: 'Questão de teste',
    pergunta: 'Qual é a capital do Brasil?',
    areaId: '456',
    topicosSelecionados: ['topico1'],
    respostasSelecionadas: 'A) Brasília'
  },
  true
);
runTest(
  'Registro com correta inválida',
  questionSchemas.register,
  {
    id: '123',
    titulo: 'Questão de teste',
    pergunta: 'Qual é a capital do Brasil?',
    areaId: '456',
    correta: 'F',
    topicosSelecionados: ['topico1'],
    respostasSelecionadas: 'A) Brasília'
  },
  false
);
runTest(
  'Registro com topicosSelecionados vazio',
  questionSchemas.register,
  {
    id: '123',
    titulo: 'Questão de teste',
    pergunta: 'Qual é a capital do Brasil?',
    areaId: '456',
    correta: 'A',
    topicosSelecionados: [],
    respostasSelecionadas: 'A) Brasília'
  },
  true
);

