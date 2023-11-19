import { Plugin } from './_types';
export declare const defaultParams: {
    floatPrecision: number;
    transformPrecision: number;
    applyTransformsStroked: boolean;
};
export declare type Params = typeof defaultParams;
export declare const bakeGroupTransforms: Plugin<Params>;
