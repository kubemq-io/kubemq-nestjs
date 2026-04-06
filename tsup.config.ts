import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    outDir: 'dist',
    external: [
      '@nestjs/common',
      '@nestjs/core',
      '@nestjs/microservices',
      '@nestjs/terminus',
      '@nestjs/cqrs',
      'kubemq-js',
      'rxjs',
      'reflect-metadata',
    ],
  },
  {
    entry: { testing: 'src/testing.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    outDir: 'dist',
    external: [
      '@nestjs/common',
      '@nestjs/core',
      '@nestjs/microservices',
      'kubemq-js',
      'rxjs',
      'reflect-metadata',
    ],
  },
  {
    entry: { cqrs: 'src/cqrs.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    outDir: 'dist',
    external: [
      '@nestjs/common',
      '@nestjs/core',
      '@nestjs/microservices',
      '@nestjs/cqrs',
      'kubemq-js',
      'rxjs',
      'reflect-metadata',
    ],
  },
]);
