import esbuild from 'esbuild';

// Build configuration
esbuild.build({
  entryPoints: ['./src/index.js'], // Entry file for the server
  outfile: './dist/bundle.cjs',    // Output file
  platform: 'node',              // Node.js runtime
  bundle: true,                  // Bundle all dependencies
  target: 'es2020',              // Output JS version
  minify: true,                  // Minify the output
  external: ['express'],         // Exclude these dependencies from bundling
})
.then(() => console.log('Build successful!'))
.catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});
