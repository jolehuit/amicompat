// Test JavaScript with modern features
const data = user?.profile?.name ?? 'Anonymous';

// Private class fields
class MyClass {
  #privateField = 42;
  #privateMethod() {
    return this.#privateField;
  }

  getValue() {
    return this.#privateMethod();
  }
}

// Top-level await
await import('./module.js');

// Dynamic import
const module = await import('./dynamic-module.js');

// Nullish coalescing with optional chaining
const result = obj?.deep?.nested?.value ?? defaultValue;