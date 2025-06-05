// filepath: review-service/test-nlp.js
try {
  console.log("Attempting to require '@nlpjs/nlp'...");
  const nlpjsPackage = require('@nlpjs/nlp');
  console.log("Successfully required '@nlpjs/nlp'.");
  console.log("Type of nlpjsPackage:", typeof nlpjsPackage);
  console.log("Keys in nlpjsPackage:", nlpjsPackage ? Object.keys(nlpjsPackage) : 'nlpjsPackage is null/undefined');

  const { NlpManager } = nlpjsPackage; // Or directly: const { NlpManager } = require('@nlpjs/nlp');
  console.log("Destructured NlpManager.");
  console.log("Type of NlpManager after destructuring:", typeof NlpManager);

  if (typeof NlpManager === 'function') {
    console.log("NlpManager is a function. Attempting to instantiate...");
    const manager = new NlpManager({ languages: ['id'] });
    console.log("NlpManager instantiated successfully. Manager object:", manager ? "Exists" : "Does not exist");
  } else {
    console.error("NlpManager is NOT a function/constructor after destructuring.");
    if (nlpjsPackage && typeof nlpjsPackage.NlpManager === 'function') {
        console.log("However, nlpjsPackage.NlpManager IS a function. Trying that way...");
        const manager = new nlpjsPackage.NlpManager({ languages: ['id'] });
        console.log("nlpjsPackage.NlpManager instantiated successfully. Manager object:", manager ? "Exists" : "Does not exist");
    } else {
        console.error("nlpjsPackage.NlpManager is also not a function/constructor.");
    }
  }
} catch (e) {
  console.error('Error in test-nlp.js:', e);
}