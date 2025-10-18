declare module 'astro:content' {
  interface Render {
    '.mdx': Promise<{
      Content: import('astro').MarkdownInstance<{}>['Content'];
      headings: import('astro').MarkdownHeading[];
      remarkPluginFrontmatter: Record<string, any>;
      components: import('astro').MDXInstance<{}>['components'];
    }>;
  }
}

declare module 'astro:content' {
  interface RenderResult {
    Content: import('astro/runtime/server/index.js').AstroComponentFactory;
    headings: import('astro').MarkdownHeading[];
    remarkPluginFrontmatter: Record<string, any>;
  }
  interface Render {
    '.md': Promise<RenderResult>;
  }

  export interface RenderedContent {
    html: string;
    metadata?: {
      imagePaths: Array<string>;
      [key: string]: unknown;
    };
  }
}

declare module 'astro:content' {
  type Flatten<T> = T extends { [K: string]: infer U } ? U : never;

  export type CollectionKey = keyof AnyEntryMap;
  export type CollectionEntry<C extends CollectionKey> = Flatten<AnyEntryMap[C]>;

  export type ContentCollectionKey = keyof ContentEntryMap;
  export type DataCollectionKey = keyof DataEntryMap;

  type AllValuesOf<T> = T extends any ? T[keyof T] : never;
  type ValidContentEntrySlug<C extends keyof ContentEntryMap> = AllValuesOf<
    ContentEntryMap[C]
  >['slug'];

  /** @deprecated Use `getEntry` instead. */
  export function getEntryBySlug<
    C extends keyof ContentEntryMap,
    E extends ValidContentEntrySlug<C> | (string & {}),
  >(
    collection: C,
    // Note that this has to accept a regular string too, for SSR
    entrySlug: E,
  ): E extends ValidContentEntrySlug<C>
    ? Promise<CollectionEntry<C>>
    : Promise<CollectionEntry<C> | undefined>;

  /** @deprecated Use `getEntry` instead. */
  export function getDataEntryById<C extends keyof DataEntryMap, E extends keyof DataEntryMap[C]>(
    collection: C,
    entryId: E,
  ): Promise<CollectionEntry<C>>;

  export function getCollection<C extends keyof AnyEntryMap, E extends CollectionEntry<C>>(
    collection: C,
    filter?: (entry: CollectionEntry<C>) => entry is E,
  ): Promise<E[]>;
  export function getCollection<C extends keyof AnyEntryMap>(
    collection: C,
    filter?: (entry: CollectionEntry<C>) => unknown,
  ): Promise<CollectionEntry<C>[]>;

  export function getEntry<
    C extends keyof ContentEntryMap,
    E extends ValidContentEntrySlug<C> | (string & {}),
  >(entry: {
    collection: C;
    slug: E;
  }): E extends ValidContentEntrySlug<C>
    ? Promise<CollectionEntry<C>>
    : Promise<CollectionEntry<C> | undefined>;
  export function getEntry<
    C extends keyof DataEntryMap,
    E extends keyof DataEntryMap[C] | (string & {}),
  >(entry: {
    collection: C;
    id: E;
  }): E extends keyof DataEntryMap[C]
    ? Promise<DataEntryMap[C][E]>
    : Promise<CollectionEntry<C> | undefined>;
  export function getEntry<
    C extends keyof ContentEntryMap,
    E extends ValidContentEntrySlug<C> | (string & {}),
  >(
    collection: C,
    slug: E,
  ): E extends ValidContentEntrySlug<C>
    ? Promise<CollectionEntry<C>>
    : Promise<CollectionEntry<C> | undefined>;
  export function getEntry<
    C extends keyof DataEntryMap,
    E extends keyof DataEntryMap[C] | (string & {}),
  >(
    collection: C,
    id: E,
  ): E extends keyof DataEntryMap[C]
    ? Promise<DataEntryMap[C][E]>
    : Promise<CollectionEntry<C> | undefined>;

  /** Resolve an array of entry references from the same collection */
  export function getEntries<C extends keyof ContentEntryMap>(
    entries: {
      collection: C;
      slug: ValidContentEntrySlug<C>;
    }[],
  ): Promise<CollectionEntry<C>[]>;
  export function getEntries<C extends keyof DataEntryMap>(
    entries: {
      collection: C;
      id: keyof DataEntryMap[C];
    }[],
  ): Promise<CollectionEntry<C>[]>;

  export function render<C extends keyof AnyEntryMap>(
    entry: AnyEntryMap[C][string],
  ): Promise<RenderResult>;

  export function reference<C extends keyof AnyEntryMap>(
    collection: C,
  ): import('astro/zod').ZodEffects<
    import('astro/zod').ZodString,
    C extends keyof ContentEntryMap
      ? {
          collection: C;
          slug: ValidContentEntrySlug<C>;
        }
      : {
          collection: C;
          id: keyof DataEntryMap[C];
        }
  >;
  // Allow generic `string` to avoid excessive type errors in the config
  // if `dev` is not running to update as you edit.
  // Invalid collection names will be caught at build time.
  export function reference<C extends string>(
    collection: C,
  ): import('astro/zod').ZodEffects<import('astro/zod').ZodString, never>;

  type ReturnTypeOrOriginal<T> = T extends (...args: any[]) => infer R ? R : T;
  type InferEntrySchema<C extends keyof AnyEntryMap> = import('astro/zod').infer<
    ReturnTypeOrOriginal<Required<ContentConfig['collections'][C]>['schema']>
  >;

  type ContentEntryMap = {
    people: {
      'aj.mdx': {
        id: 'aj.mdx';
        slug: 'aj';
        body: string;
        collection: 'people';
        data: InferEntrySchema<'people'>;
      } & { render(): Render['.mdx'] };
    };
    posters: {
      'bumblebee-foundation-model-for-particle-physics-di-2024.mdx': {
        id: 'bumblebee-foundation-model-for-particle-physics-di-2024.mdx';
        slug: 'bumblebee-foundation-model-for-particle-physics-di-2024';
        body: string;
        collection: 'posters';
        data: InferEntrySchema<'posters'>;
      } & { render(): Render['.mdx'] };
      'observation-of-entangled-top-quarks-at-the-lhc-mea-2024.mdx': {
        id: 'observation-of-entangled-top-quarks-at-the-lhc-mea-2024.mdx';
        slug: 'observation-of-entangled-top-quarks-at-the-lhc-mea-2024';
        body: string;
        collection: 'posters';
        data: InferEntrySchema<'posters'>;
      } & { render(): Render['.mdx'] };
      'quantum-annealing-to-reconstruct-highest-human-mad-2023.mdx': {
        id: 'quantum-annealing-to-reconstruct-highest-human-mad-2023.mdx';
        slug: 'quantum-annealing-to-reconstruct-highest-human-mad-2023';
        body: string;
        collection: 'posters';
        data: InferEntrySchema<'posters'>;
      } & { render(): Render['.mdx'] };
      'track-clustering-with-a-quantum-annealer-for-prima-2019.mdx': {
        id: 'track-clustering-with-a-quantum-annealer-for-prima-2019.mdx';
        slug: 'track-clustering-with-a-quantum-annealer-for-prima-2019';
        body: string;
        collection: 'posters';
        data: InferEntrySchema<'posters'>;
      } & { render(): Render['.mdx'] };
      'track-clustering-with-a-quantum-annealer-for-prima-2022.mdx': {
        id: 'track-clustering-with-a-quantum-annealer-for-prima-2022.mdx';
        slug: 'track-clustering-with-a-quantum-annealer-for-prima-2022';
        body: string;
        collection: 'posters';
        data: InferEntrySchema<'posters'>;
      } & { render(): Render['.mdx'] };
      'track-clustering-with-a-quantum-annealer-for-prima-2023.mdx': {
        id: 'track-clustering-with-a-quantum-annealer-for-prima-2023.mdx';
        slug: 'track-clustering-with-a-quantum-annealer-for-prima-2023';
        body: string;
        collection: 'posters';
        data: InferEntrySchema<'posters'>;
      } & { render(): Render['.mdx'] };
    };
    posts: {
      'hello-world.mdx': {
        id: 'hello-world.mdx';
        slug: 'hello-world';
        body: string;
        collection: 'posts';
        data: InferEntrySchema<'posts'>;
      } & { render(): Render['.mdx'] };
    };
    'professional-development': {
      '3rd-top-quark-physics-at-the-precision-frontier-2023.mdx': {
        id: '3rd-top-quark-physics-at-the-precision-frontier-2023.mdx';
        slug: '3rd-top-quark-physics-at-the-precision-frontier-2023';
        body: string;
        collection: 'professional-development';
        data: any;
      } & { render(): Render['.mdx'] };
    };
    professionalDevelopment: Record<
      string,
      {
        id: string;
        slug: string;
        body: string;
        collection: 'professionalDevelopment';
        data: InferEntrySchema<'professionalDevelopment'>;
        render(): Render['.md'];
      }
    >;
    projects: {
      'example.mdx': {
        id: 'example.mdx';
        slug: 'example';
        body: string;
        collection: 'projects';
        data: InferEntrySchema<'projects'>;
      } & { render(): Render['.mdx'] };
    };
    publications: {
      'building-machine-learning-challenges-for-anomaly-d-2025.mdx': {
        id: 'building-machine-learning-challenges-for-anomaly-d-2025.mdx';
        slug: 'building-machine-learning-challenges-for-anomaly-d-2025';
        body: string;
        collection: 'publications';
        data: InferEntrySchema<'publications'>;
      } & { render(): Render['.mdx'] };
      'bumblebee-foundation-model-for-particle-physics-di-2024.mdx': {
        id: 'bumblebee-foundation-model-for-particle-physics-di-2024.mdx';
        slug: 'bumblebee-foundation-model-for-particle-physics-di-2024';
        body: string;
        collection: 'publications';
        data: InferEntrySchema<'publications'>;
      } & { render(): Render['.mdx'] };
      'enhanced-reconstruction-of-dileptonic-top-quark-an-2025.mdx': {
        id: 'enhanced-reconstruction-of-dileptonic-top-quark-an-2025.mdx';
        slug: 'enhanced-reconstruction-of-dileptonic-top-quark-an-2025';
        body: string;
        collection: 'publications';
        data: InferEntrySchema<'publications'>;
      } & { render(): Render['.mdx'] };
      'ml-hep.mdx': {
        id: 'ml-hep.mdx';
        slug: 'ml-hep';
        body: string;
        collection: 'publications';
        data: InferEntrySchema<'publications'>;
      } & { render(): Render['.mdx'] };
      'observation-of-quantum-entanglement-in-top-quark-p-2024.mdx': {
        id: 'observation-of-quantum-entanglement-in-top-quark-p-2024.mdx';
        slug: 'observation-of-quantum-entanglement-in-top-quark-p-2024';
        body: string;
        collection: 'publications';
        data: InferEntrySchema<'publications'>;
      } & { render(): Render['.mdx'] };
      'qa_pv.mdx': {
        id: 'qa_pv.mdx';
        slug: 'qa_pv';
        body: string;
        collection: 'publications';
        data: InferEntrySchema<'publications'>;
      } & { render(): Render['.mdx'] };
      'quantum-information-meets-high-energy-physics-inpu-2025.mdx': {
        id: 'quantum-information-meets-high-energy-physics-inpu-2025.mdx';
        slug: 'quantum-information-meets-high-energy-physics-inpu-2025';
        body: string;
        collection: 'publications';
        data: InferEntrySchema<'publications'>;
      } & { render(): Render['.mdx'] };
      'test-latex.mdx': {
        id: 'test-latex.mdx';
        slug: 'test-latex';
        body: string;
        collection: 'publications';
        data: InferEntrySchema<'publications'>;
      } & { render(): Render['.mdx'] };
      'top-quarks-as-a-probe-to-quantum-information-2022.mdx': {
        id: 'top-quarks-as-a-probe-to-quantum-information-2022.mdx';
        slug: 'top-quarks-as-a-probe-to-quantum-information-2022';
        body: string;
        collection: 'publications';
        data: InferEntrySchema<'publications'>;
      } & { render(): Render['.mdx'] };
      'track-clustering-with-a-quantum-annealer-for-prima-1903.mdx': {
        id: 'track-clustering-with-a-quantum-annealer-for-prima-1903.mdx';
        slug: 'track-clustering-with-a-quantum-annealer-for-prima-1903';
        body: string;
        collection: 'publications';
        data: InferEntrySchema<'publications'>;
      } & { render(): Render['.mdx'] };
      'track-clustering-with-a-quantum-annealer-for-prima-2019.mdx': {
        id: 'track-clustering-with-a-quantum-annealer-for-prima-2019.mdx';
        slug: 'track-clustering-with-a-quantum-annealer-for-prima-2019';
        body: string;
        collection: 'publications';
        data: InferEntrySchema<'publications'>;
      } & { render(): Render['.mdx'] };
      'transformer_mmd.mdx': {
        id: 'transformer_mmd.mdx';
        slug: 'transformer_mmd';
        body: string;
        collection: 'publications';
        data: InferEntrySchema<'publications'>;
      } & { render(): Render['.mdx'] };
      'ttbar_entanglement_obs.mdx': {
        id: 'ttbar_entanglement_obs.mdx';
        slug: 'ttbar_entanglement_obs';
        body: string;
        collection: 'publications';
        data: InferEntrySchema<'publications'>;
      } & { render(): Render['.mdx'] };
    };
    talks: {
      'bumblebee-foundation-model-for-particle-physics-di-2024.mdx': {
        id: 'bumblebee-foundation-model-for-particle-physics-di-2024.mdx';
        slug: 'bumblebee-foundation-model-for-particle-physics-di-2024';
        body: string;
        collection: 'talks';
        data: InferEntrySchema<'talks'>;
      } & { render(): Render['.mdx'] };
      'challenges-in-high-energy-experiments-measuring-qu-2023.mdx': {
        id: 'challenges-in-high-energy-experiments-measuring-qu-2023.mdx';
        slug: 'challenges-in-high-energy-experiments-measuring-qu-2023';
        body: string;
        collection: 'talks';
        data: InferEntrySchema<'talks'>;
      } & { render(): Render['.mdx'] };
      'challenges-of-entanglement-measurement-in-ttbar-fi-2023.mdx': {
        id: 'challenges-of-entanglement-measurement-in-ttbar-fi-2023.mdx';
        slug: 'challenges-of-entanglement-measurement-in-ttbar-fi-2023';
        body: string;
        collection: 'talks';
        data: InferEntrySchema<'talks'>;
      } & { render(): Render['.mdx'] };
      'entangled-top-quarks-at-the-lhc-measured-with-the--2024.mdx': {
        id: 'entangled-top-quarks-at-the-lhc-measured-with-the--2024.mdx';
        slug: 'entangled-top-quarks-at-the-lhc-measured-with-the--2024';
        body: string;
        collection: 'talks';
        data: InferEntrySchema<'talks'>;
      } & { render(): Render['.mdx'] };
      'entanglement-more-at-the-cms-2022.mdx': {
        id: 'entanglement-more-at-the-cms-2022.mdx';
        slug: 'entanglement-more-at-the-cms-2022';
        body: string;
        collection: 'talks';
        data: InferEntrySchema<'talks'>;
      } & { render(): Render['.mdx'] };
      'entanglement-of-top-quarks-in-the-production-thres-2024.mdx': {
        id: 'entanglement-of-top-quarks-in-the-production-thres-2024.mdx';
        slug: 'entanglement-of-top-quarks-in-the-production-thres-2024';
        body: string;
        collection: 'talks';
        data: InferEntrySchema<'talks'>;
      } & { render(): Render['.mdx'] };
      'example.mdx': {
        id: 'example.mdx';
        slug: 'example';
        body: string;
        collection: 'talks';
        data: InferEntrySchema<'talks'>;
      } & { render(): Render['.mdx'] };
      'investigation-of-entangled-and-bound-ttbar-pairs-a-2022.mdx': {
        id: 'investigation-of-entangled-and-bound-ttbar-pairs-a-2022.mdx';
        slug: 'investigation-of-entangled-and-bound-ttbar-pairs-a-2022';
        body: string;
        collection: 'talks';
        data: InferEntrySchema<'talks'>;
      } & { render(): Render['.mdx'] };
      'ml-physics-2024.mdx': {
        id: 'ml-physics-2024.mdx';
        slug: 'ml-physics-2024';
        body: string;
        collection: 'talks';
        data: InferEntrySchema<'talks'>;
      } & { render(): Render['.mdx'] };
      'observation-of-entangled-top-quarks-at-the-lhc-mea-2024.mdx': {
        id: 'observation-of-entangled-top-quarks-at-the-lhc-mea-2024.mdx';
        slug: 'observation-of-entangled-top-quarks-at-the-lhc-mea-2024';
        body: string;
        collection: 'talks';
        data: InferEntrySchema<'talks'>;
      } & { render(): Render['.mdx'] };
      'observation-of-entangled-top-quarks-with-the-cms-d-2025.mdx': {
        id: 'observation-of-entangled-top-quarks-with-the-cms-d-2025.mdx';
        slug: 'observation-of-entangled-top-quarks-with-the-cms-d-2025';
        body: string;
        collection: 'talks';
        data: InferEntrySchema<'talks'>;
      } & { render(): Render['.mdx'] };
      'panel-discussion-2023.mdx': {
        id: 'panel-discussion-2023.mdx';
        slug: 'panel-discussion-2023';
        body: string;
        collection: 'talks';
        data: InferEntrySchema<'talks'>;
      } & { render(): Render['.mdx'] };
      'panel-session-making-it-happen-steps-needed-for-re-2023.mdx': {
        id: 'panel-session-making-it-happen-steps-needed-for-re-2023.mdx';
        slug: 'panel-session-making-it-happen-steps-needed-for-re-2023';
        body: string;
        collection: 'talks';
        data: InferEntrySchema<'talks'>;
      } & { render(): Render['.mdx'] };
      'quantum-annealing-applications-in-collider-hep-ex-2023.mdx': {
        id: 'quantum-annealing-applications-in-collider-hep-ex-2023.mdx';
        slug: 'quantum-annealing-applications-in-collider-hep-ex-2023';
        body: string;
        collection: 'talks';
        data: InferEntrySchema<'talks'>;
      } & { render(): Render['.mdx'] };
      'quantum-annealing-to-reconstruct-highest-human-mad-2023.mdx': {
        id: 'quantum-annealing-to-reconstruct-highest-human-mad-2023.mdx';
        slug: 'quantum-annealing-to-reconstruct-highest-human-mad-2023';
        body: string;
        collection: 'talks';
        data: InferEntrySchema<'talks'>;
      } & { render(): Render['.mdx'] };
      'recent-highlights-of-top-quark-property-measuremen-2024.mdx': {
        id: 'recent-highlights-of-top-quark-property-measuremen-2024.mdx';
        slug: 'recent-highlights-of-top-quark-property-measuremen-2024';
        body: string;
        collection: 'talks';
        data: InferEntrySchema<'talks'>;
      } & { render(): Render['.mdx'] };
      'recent-measurements-of-top-quark-properties-at-cms-2024.mdx': {
        id: 'recent-measurements-of-top-quark-properties-at-cms-2024.mdx';
        slug: 'recent-measurements-of-top-quark-properties-at-cms-2024';
        body: string;
        collection: 'talks';
        data: InferEntrySchema<'talks'>;
      } & { render(): Render['.mdx'] };
      'reconstructing-proton-proton-collision-positions-a-2019.mdx': {
        id: 'reconstructing-proton-proton-collision-positions-a-2019.mdx';
        slug: 'reconstructing-proton-proton-collision-positions-a-2019';
        body: string;
        collection: 'talks';
        data: InferEntrySchema<'talks'>;
      } & { render(): Render['.mdx'] };
      'reconstructing-proton-proton-collision-positions-a-2021.mdx': {
        id: 'reconstructing-proton-proton-collision-positions-a-2021.mdx';
        slug: 'reconstructing-proton-proton-collision-positions-a-2021';
        body: string;
        collection: 'talks';
        data: InferEntrySchema<'talks'>;
      } & { render(): Render['.mdx'] };
      'towards-quantum-measurements-at-cms-2023.mdx': {
        id: 'towards-quantum-measurements-at-cms-2023.mdx';
        slug: 'towards-quantum-measurements-at-cms-2023';
        body: string;
        collection: 'talks';
        data: InferEntrySchema<'talks'>;
      } & { render(): Render['.mdx'] };
      'track-clustering-with-a-quantum-annealer-for-prima-2019.mdx': {
        id: 'track-clustering-with-a-quantum-annealer-for-prima-2019.mdx';
        slug: 'track-clustering-with-a-quantum-annealer-for-prima-2019';
        body: string;
        collection: 'talks';
        data: InferEntrySchema<'talks'>;
      } & { render(): Render['.mdx'] };
      'track-clustering-with-a-quantum-annealer-for-prima-2022.mdx': {
        id: 'track-clustering-with-a-quantum-annealer-for-prima-2022.mdx';
        slug: 'track-clustering-with-a-quantum-annealer-for-prima-2022';
        body: string;
        collection: 'talks';
        data: InferEntrySchema<'talks'>;
      } & { render(): Render['.mdx'] };
      'track-clustering-with-a-quantum-annealer-for-prima-2023.mdx': {
        id: 'track-clustering-with-a-quantum-annealer-for-prima-2023.mdx';
        slug: 'track-clustering-with-a-quantum-annealer-for-prima-2023';
        body: string;
        collection: 'talks';
        data: InferEntrySchema<'talks'>;
      } & { render(): Render['.mdx'] };
    };
    teaching: {
      'comp-methods-spring23.mdx': {
        id: 'comp-methods-spring23.mdx';
        slug: 'comp-methods-spring23';
        body: string;
        collection: 'teaching';
        data: InferEntrySchema<'teaching'>;
      } & { render(): Render['.mdx'] };
      'quantum-computing-fall24.mdx': {
        id: 'quantum-computing-fall24.mdx';
        slug: 'quantum-computing-fall24';
        body: string;
        collection: 'teaching';
        data: InferEntrySchema<'teaching'>;
      } & { render(): Render['.mdx'] };
    };
  };

  type DataEntryMap = {};

  type AnyEntryMap = ContentEntryMap & DataEntryMap;

  export type ContentConfig = typeof import('../../src/content/config.js');
}
