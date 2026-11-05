export const catalog:{id:string;name:string;aliases:string[];price:number}[];
export function decideTrade(state:{gold:number},proposal:unknown):{outcome:'SUCCESS'|'FAIL';reason:string;proposal:Record<string,unknown>};
export function parseNarrative(raw:string,speaker:string,outcome:string):{speaker:string;dialogue:string;narration:string}|null;
