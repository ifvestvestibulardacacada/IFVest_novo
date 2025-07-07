const { simuladoSchemas } = require('./schemas');
const {runTest} = require('./test');

console.log('\n=== Testes para simuladoSchemas ===');
runTest(
  'Registro de simulado válido',
  simuladoSchemas.register,
  {
    titulo: 'Simulado de Matemática',
    descricao: 'Simulado para prática de matemática básica.',
    tipo: 'Objetivo',
    selectedQuestionIds: ['1', '2', '3']
  },
  true
);
runTest(
  'Registro de simulado com descrição inválida',
  simuladoSchemas.register,
  {
    titulo: 'Simulado de Matemática',
    descricao: 'Descrição com ; DROP TABLE simulados',
    tipo: 'Objetivo',
    selectedQuestionIds: ['1']
  },
  false
);
runTest(
  'Submissão de simulado válida',
  simuladoSchemas.submit,
  {
    questoes: ['1', '2'],
    respostas: ['A', 'B']
  },
  true
);
runTest(
  'Remoção de questão válida',
  simuladoSchemas.removeQuestion,
  { selectedQuestionIds: ['1', '2'] },
  true
);
runTest(
  'Adição de questão válida',
  simuladoSchemas.addQuestion,
  { selectedQuestionIds: ['3', '4'] },
  true
);

console.log('=== Testes Adicionais para simulado schemas ===');
runTest(
  'Registro com descrição de 1000 caracteres',
  simuladoSchemas.register,
  {
    titulo: 'Simulado de Matemática',
    descricao: 'a'.repeat(1000),
    tipo: 'Objetivo',
    selectedQuestionIds: ['1']
  },
  true
);
runTest(
  'Edição com descrição menor que 10 caracteres',
  simuladoSchemas.edit,
  {
    titulo: 'Simulado de Matemática',
    descricao: 'curto',
    tipo: 'OBJETIVO'
  },
  false
);
runTest(
  'Registro com selectedQuestionIds vazio',
  simuladoSchemas.register,
  {
    titulo: 'Simulado de Matemática',
    descricao: 'Simulado para prática de matemática básica.',
    tipo: 'Objetivo',
    selectedQuestionIds: []
  },
  false
);
runTest(
  'Registro com ID de questão inválido',
  simuladoSchemas.register,
  {
    titulo: 'Simulado de Matemática',
    descricao: 'Simulado para prática de matemática básica.',
    tipo: 'Objetivo',
    selectedQuestionIds: ['abc']
  },
  false
);
runTest(
  'Submissão com respostas vazias',
  simuladoSchemas.submit,
  {
    questoes: ['1', '2'],
    respostas: []
  },
  true
);