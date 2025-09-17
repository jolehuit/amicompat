// Test JavaScript with features from web-features
class MyClass {
  constructor() {
    this.value = 42n; // BigInt
  }
}

// Async functions
async function fetchData() {
  return await fetch('/api/data');
}

// Generator functions
function* generateNumbers() {
  yield 1;
  yield 2;
  yield 3;
}

// Arrow functions (part of Functions feature)
const multiply = (a, b) => a * b;