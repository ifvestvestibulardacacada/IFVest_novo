function runTest(description, schema, data, shouldPass) {
  try {
    schema.parse(data);
    if (shouldPass) {
      console.log(`✅ ${description}: PASSOU`);
    } else {
      console.error(`❌ ${description}: FALHOU (Deveria ter falhado, mas passou)`);
    }
  } catch (error) {
    if (shouldPass) {
      console.error(`❌ ${description}: FALHOU - ${error.errors[0].message}`);
    } else {
      console.log(`✅ ${description}: PASSOU (Falhou como esperado)`);
    }
  }
}

// Testes para authSchemas
exports.runTest = runTest;  
