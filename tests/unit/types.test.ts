import { describe, it, expect } from 'vitest';
import {
  AuditProjectInputSchema,
  AuditFileInputSchema,
  GetFeatureStatusInputSchema,
  ExportLastReportInputSchema,
} from '../../src/types/index.js';

describe('Zod Schema Validation', () => {
  describe('AuditProjectInputSchema', () => {
    it('should validate correct project audit input', () => {
      const validInput = {
        project_path: '/path/to/project',
        target: 'baseline-2024',
        max_files: 1000,
        export_path: '/path/to/export.json'
      };

      const result = AuditProjectInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should use default values', () => {
      const minimalInput = {
        project_path: '/path/to/project'
      };

      const result = AuditProjectInputSchema.parse(minimalInput);
      expect(result.target).toBe('baseline-2025');
      expect(result.max_files).toBe(10000);
    });

    it('should reject invalid target', () => {
      const invalidInput = {
        project_path: '/path/to/project',
        target: 'invalid-target'
      };

      const result = AuditProjectInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject negative max_files', () => {
      const invalidInput = {
        project_path: '/path/to/project',
        max_files: -1
      };

      const result = AuditProjectInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should require project_path', () => {
      const invalidInput = {
        target: 'baseline-2024'
      };

      const result = AuditProjectInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('AuditFileInputSchema', () => {
    it('should validate correct file audit input', () => {
      const validInput = {
        file_path: '/path/to/file.js'
      };

      const result = AuditFileInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should require file_path', () => {
      const invalidInput = {};

      const result = AuditFileInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject non-string file_path', () => {
      const invalidInput = {
        file_path: 123
      };

      const result = AuditFileInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('GetFeatureStatusInputSchema', () => {
    it('should validate correct feature status input', () => {
      const validInput = {
        feature: 'css-container-queries'
      };

      const result = GetFeatureStatusInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should require feature', () => {
      const invalidInput = {};

      const result = GetFeatureStatusInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject non-string feature', () => {
      const invalidInput = {
        feature: 123
      };

      const result = GetFeatureStatusInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('ExportLastReportInputSchema', () => {
    it('should validate correct export input', () => {
      const validInput = {
        path: '/path/to/report.json'
      };

      const result = ExportLastReportInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should require path', () => {
      const invalidInput = {};

      const result = ExportLastReportInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject non-string path', () => {
      const invalidInput = {
        path: 123
      };

      const result = ExportLastReportInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('Schema combinations', () => {
    it('should handle all valid baseline targets', () => {
      const targets = ['baseline-2025', 'baseline-2024', 'baseline-2023', 'widely', 'limited'];

      targets.forEach(target => {
        const input = {
          project_path: '/path/to/project',
          target
        };

        const result = AuditProjectInputSchema.safeParse(input);
        expect(result.success).toBe(true);
      });
    });

    it('should handle optional fields correctly', () => {
      const inputWithOptionals = {
        project_path: '/path/to/project',
        target: 'baseline-2024',
        max_files: 5000,
        export_path: '/path/to/export.json'
      };

      const inputWithoutOptionals = {
        project_path: '/path/to/project'
      };

      expect(AuditProjectInputSchema.safeParse(inputWithOptionals).success).toBe(true);
      expect(AuditProjectInputSchema.safeParse(inputWithoutOptionals).success).toBe(true);
    });
  });
});