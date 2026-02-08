declare module 'sql.js' {
  export class Database {
    constructor(data?: Buffer | Uint8Array | number[] | null);
    run(sql: string, params?: any[] | {[key: string]: any}): Database;
    exec(sql: string): { columns: string[], values: any[][] }[];
    each(sql: string, params: any[] | object, callback: (obj: any) => void, done: () => void): void;
    prepare(sql: string, params?: any[] | object): Statement;
    export(): Uint8Array;
    close(): void;
    getRowsModified(): number;
  }

  export class Statement {
    bind(values?: any[] | object): boolean;
    step(): boolean;
    get(params?: any[] | object): any[];
    getColumnNames(): string[];
    getAsObject(params?: any[] | object): {[key: string]: any};
    run(params?: any[] | object): void;
    getString(): string;
    freemem(): void;
    free(): boolean;
  }
  
  export interface SqlJsStatic {
    Database: typeof Database;
    Statement: typeof Statement;
  }

  function initSqlJs(config?: any): Promise<SqlJsStatic>;
  export default initSqlJs;
}
