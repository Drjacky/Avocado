import { JsApi } from './jsapi';
export interface Options {
    pretty?: boolean;
}
export declare function js2xml(data: JsApi, options?: Options): string;
