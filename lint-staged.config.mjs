import path from "path";
 
const buildEslintCommand = (filenames) =>
  `next lint --fix --file ${filenames
    .map((f) => path.relative(process.cwd(), f))
    .join(' --file ')}`;
 
const runEslint = {
  '*.{js,jsx,ts,tsx}': buildEslintCommand
};

export default runEslint;