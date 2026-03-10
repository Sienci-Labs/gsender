module.exports = {
  pdf: jest.fn(),
  Page: () => null,
  View: () => null,
  Text: () => null,
  Document: () => null,
  StyleSheet: { create: (s) => s },
  Image: () => null,
};
