// code from https://github.com/ai/nanoid

declare const msCrypto: typeof crypto;

const browserCrypto = crypto || msCrypto;

// This alphabet uses `A-Za-z0-9_-` symbols.
// The order of characters is optimized for better gzip and brotli compression.
// Same as in non-secure/index.js
const urlAlphabet = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';

export const random = (bytes: number) => browserCrypto.getRandomValues(new Uint8Array(bytes));

export const customRandom = (alphabet: string, defaultSize: number, getRandom: (bytes: number) => Uint8Array) => {
  const mask = (2 << Math.log2(alphabet.length - 1)) - 1;
  const step = -~((1.6 * mask * defaultSize) / alphabet.length);

  return (size = defaultSize) => {
    let id = '';
    while (true) {
      let bytes = getRandom(step);
      // A compact alternative for `for (var i = 0; i < step; i++)`.
      let j = step | 0;
      while (j--) {
        // Adding `|| ''` refuses a random byte that exceeds the alphabet size.
        id += alphabet[bytes[j] & mask] || '';
        if (id.length >= size) return id;
      }
    }
  };
};

export const customAlphabet = (alphabet: string, size = 21) => customRandom(alphabet, size | 0, random);

export const nanoid = (size = 21) => {
  let id = '';
  let bytes = browserCrypto.getRandomValues(new Uint8Array((size |= 0)));
  while (size--) {
    // Using the bitwise AND operator to "cap" the value of
    // the random byte from 255 to 63, in that way we can make sure
    // that the value will be a valid index for the "chars" string.
    id += urlAlphabet[bytes[size] & 63];
  }
  return id;
};
