import { describe, expect, it } from 'vitest';
import {
  canWriteCommonDocumentCategory,
  getWritableCommonCategories,
} from './commonDocumentTaxonomy';

describe('CommonDocumentTaxonomy', () => {
  it('restricts common-docs:write:cse to csePv, cseBde and harassmentBestPractices', () => {
    const cseOnlyRights = {
      canWriteAll: false,
      canWriteCse: true,
      canWriteWelcomeKits: false,
    };

    expect(canWriteCommonDocumentCategory('csePv', cseOnlyRights)).toBe(true);
    expect(canWriteCommonDocumentCategory('cseBde', cseOnlyRights)).toBe(true);
    expect(canWriteCommonDocumentCategory('harassmentBestPractices', cseOnlyRights)).toBe(true);
    expect(canWriteCommonDocumentCategory('companyAgreements', cseOnlyRights)).toBe(false);
    expect(canWriteCommonDocumentCategory('rseReport', cseOnlyRights)).toBe(false);

    expect(getWritableCommonCategories(cseOnlyRights)).toEqual([
      'csePv',
      'cseBde',
      'harassmentBestPractices',
    ]);
  });

  it('allows full common document publishing when common-docs:write is granted', () => {
    const hrRights = {
      canWriteAll: true,
      canWriteCse: false,
      canWriteWelcomeKits: false,
    };

    expect(canWriteCommonDocumentCategory('companyAgreements', hrRights)).toBe(true);
    expect(getWritableCommonCategories(hrRights)).toHaveLength(19);
  });
});
