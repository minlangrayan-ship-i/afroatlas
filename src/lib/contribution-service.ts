import { draftSchema, type ContributionDraft } from './schema';
export interface ContributionService {
  saveDraft: (draft: ContributionDraft) => boolean;
  readDraft: () => ContributionDraft | null;
  exportDraft: (draft: ContributionDraft) => void;
}
export const localContributionService: ContributionService = {
  saveDraft(draft) {
    try {
      localStorage.setItem('afroatlas:v1:contribution', JSON.stringify(draftSchema.parse(draft)));
      return true;
    } catch {
      return false;
    }
  },
  readDraft() {
    try {
      const parsed = draftSchema.safeParse(
        JSON.parse(localStorage.getItem('afroatlas:v1:contribution') || 'null'),
      );
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  },
  exportDraft(draft) {
    const valid = draftSchema.parse(draft);
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(valid, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'afroatlas-proposition.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
