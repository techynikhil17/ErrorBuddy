declare module "fast-levenshtein" {
  interface LevenshteinModule {
    get(left: string, right: string): number;
  }

  const levenshtein: LevenshteinModule;

  export default levenshtein;
}
