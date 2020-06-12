import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'umd',
      name: 'VueEventBus',
    },
    { file: 'dist/index.esm.js', format: 'esm' },
  ],
  plugins: [typescript()]
};
