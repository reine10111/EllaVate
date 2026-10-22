function logStep(message) {
  console.log(`💜 [${new Date().toLocaleTimeString()}] ${message}`);
}

module.exports = { logStep };