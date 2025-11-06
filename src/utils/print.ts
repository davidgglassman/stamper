export const print = {
  line: (text: string = '', full: boolean = true) => {
    console.log(text);

    if (full) {
      console.log();
    }
  },
  separator: () => console.log('-'.repeat(50)),
  finish: () => console.log(),
  success: (text: string) => {
    console.log(`✅ ${text}`);
    console.log();
  },
  error: (text: string, subtext?: string) => {
    console.log(`❌ ${text}`);

    if (subtext) {
      console.log(subtext);
    }
    console.log();
  }
};
