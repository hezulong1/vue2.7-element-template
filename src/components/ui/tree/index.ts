import Tree from './src/Tree.vue';

export { Tree };

export * from './src/utils';
export * from './src/typings';
export * from './src/props';

export type TreeInstance = InstanceType<typeof Tree> & unknown;
