export const print = {
  line: (text: string = '') => console.log(text),
  fullLine: (text: string = '') => {
    console.log(text);
    console.log();
  },
  separator: () => console.log('-'.repeat(50)),
  finish: () => console.log(),
  success: (text: string) => {
    console.log(`✅ ${text}`);
    console.log();
  },
  error: (text: string) => {
    console.log(`❌ ${text}`);
    console.log();
  },
};
