export function assertTextProvider(provider) {
  if (!provider || typeof provider.generateText !== "function") {
    throw new Error("provider must implement generateText");
  }
  return provider;
}

export function assertStructuredProvider(provider) {
  if (!provider || typeof provider.generateStructured !== "function") {
    throw new Error("provider must implement generateStructured");
  }
  return provider;
}

export function assertImageProvider(provider) {
  if (!provider || typeof provider.generateImage !== "function") {
    throw new Error("provider must implement generateImage");
  }
  return provider;
}
