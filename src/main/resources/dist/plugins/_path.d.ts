import { JsApi } from '../lib/jsapi';
export interface PathItem {
    instruction: string;
    data?: number[];
    coords?: number[];
    base?: number[];
}
export declare type Point = [number, number];
export declare type Curve = [number, number, number, number, number, number];
export interface Circle {
    center: Point;
    radius: number;
}
export declare function path2js(path: JsApi): {
    instruction: string;
    data?: number[];
}[];
export declare function convertToRelative(path: PathItem[]): PathItem[];
export declare function applyTransforms(group: JsApi, elem: JsApi, path: PathItem[], params: {
    transformPrecision: number;
    applyTransformsStroked: boolean;
}): PathItem[];
export declare function getGroupAttrs(group: JsApi): {
    px: number;
    py: number;
    sx: number;
    sy: number;
    tx: number;
    ty: number;
    r: number;
};
export declare type Matrix = [number, number, number, number, number, number];
export interface GroupTransform {
    sx: number;
    sy: number;
    r: number;
    tx: number;
    ty: number;
    px: number;
    py: number;
}
export declare function getScaling(matrix: Matrix): {
    sx: number;
    sy: number;
};
export declare function getRotation(matrix: Matrix): {
    r: number;
};
export declare function getTranslation(matrix: Matrix): {
    tx: number;
    ty: number;
};
export declare function flattenGroups(groups: GroupTransform[]): [number, number, number, number, number, number];
export declare function js2path(path: JsApi, data: PathItem[], params: {
    collapseRepeated: boolean;
    leadingZero: boolean;
    negativeExtraSpace: boolean;
}): void;
export declare function intersects(path1: PathItem[], path2: PathItem[]): boolean;
