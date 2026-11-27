import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC_ROOT = path.resolve(__dirname, '../..');

function collectSourceFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

function extractImports(content: string): string[] {
  const imports: string[] = [];
  const fromRegex = /\bfrom\s+['"]([^'"]+)['"]/g;
  const sideEffectRegex = /\bimport\s+['"]([^'"]+)['"]/g;
  const dynamicRegex = /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;

  for (const regex of [fromRegex, sideEffectRegex, dynamicRegex]) {
    for (const match of content.matchAll(regex)) {
      if (match[1]) {
        imports.push(match[1]);
      }
    }
  }

  return imports;
}

function normalizePosix(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

function findFeatureViolations(file: string): string[] {
  const rel = normalizePosix(path.relative(SRC_ROOT, file));
  if (!rel.startsWith('features/')) {
    return [];
  }

  const currentFeature = rel.split('/')[1];
  const content = fs.readFileSync(file, 'utf8');
  const violations: string[] = [];

  for (const specifier of extractImports(content)) {
    if (specifier.startsWith('@/app/')) {
      violations.push(`${rel} imports app module "${specifier}"`);
      continue;
    }

    if (specifier.startsWith('@/features/')) {
      const parts = specifier.replace('@/features/', '').split('/');
      const targetFeature = parts[0];
      if (targetFeature && targetFeature !== currentFeature && parts.length > 1) {
        violations.push(
          `${rel} imports internal file "${specifier}" instead of "@/features/${targetFeature}"`,
        );
      }
    }
  }

  return violations;
}

describe('Feature-Sliced Architecture Boundaries', () => {
  const allFiles = collectSourceFiles(SRC_ROOT);

  it('prevents shared modules (outside shared/test) from importing features or app', () => {
    const violations: string[] = [];

    for (const file of allFiles) {
      const rel = normalizePosix(path.relative(SRC_ROOT, file));
      if (!rel.startsWith('shared/') || rel.startsWith('shared/test/')) {
        continue;
      }

      const content = fs.readFileSync(file, 'utf8');
      for (const specifier of extractImports(content)) {
        if (specifier.startsWith('@/features/') || specifier.startsWith('@/app/')) {
          violations.push(`${rel} imports forbidden module "${specifier}"`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('prevents feature modules from importing app or internal files of other features', () => {
    const violations = allFiles.flatMap(findFeatureViolations);
    expect(violations).toEqual([]);
  });
});
