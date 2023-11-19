export interface Attr {
    name: string;
    value: string;
    prefix: string;
    local: string;
}
export interface Options {
    content?: JsApi[];
    parentNode?: JsApi;
    elem?: string;
    prefix?: string;
    local?: string;
    attrs?: {
        [name: string]: Attr;
    };
    comment?: {
        text: string;
    };
    processingInstruction?: {
        name: string;
        body: string;
    };
}
export declare class JsApi implements Options {
    content: JsApi[];
    parentNode?: JsApi;
    readonly elem?: string;
    readonly prefix?: string;
    readonly local?: string;
    attrs?: {
        [name: string]: Attr;
    };
    readonly comment?: {
        text: string;
    };
    readonly processingInstruction?: {
        name: string;
        body: string;
    };
    pathJS?: Array<{
        instruction: string;
        data?: number[];
    }>;
    constructor(arg: Options);
    isElem(elemNames?: string | string[]): boolean;
    isEmpty(): boolean;
    spliceContent(start: number, n: number, insertion: JsApi[]): any;
    hasAttr(name?: string, val?: any): boolean;
    attr(name: string, val?: string): Attr;
    removeAttr(name: string | string[]): boolean;
    addAttr(attr: Attr): false | Attr;
    eachAttr(callback: (attr: Attr) => void, context?: any): boolean;
}
