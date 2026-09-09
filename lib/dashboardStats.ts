export function countSavedAnalyses(analyses: readonly unknown[] | null | undefined): number {
    return analyses?.length ?? 0;
}
