export interface InterpreterContext {
  playerInput: string;
  catalog: {id: string; name: string; aliases: string[]}[];
  recentLines: {role: 'player' | 'npc' | 'narration'; text: string}[];
  stateReference: Record<string, unknown> | null;
}
export type Proposal =
  | {status:'resolved';action:{type:'buy_item';itemId:string;quantity:number} | {type:'inspect_item';itemId:string;question:string}}
  | {status:'needs_clarification';missingFields:('itemId'|'quantity'|'intent')[];question:string}
  | {status:'unsupported';reasonCode:'unsupported_action'|'multiple_actions'|'non_action'}
  | {status:'invalid_output'|'unavailable';reasonCode:string};
export function validateContext(value: unknown): InterpreterContext;
export function parseProposal(raw:string,catalog:InterpreterContext['catalog']):Proposal;
export function buildMessages(input:InterpreterContext):{systemPrompt:string;messages:{role:'user';content:string}[]};
export function interpretAction(input:InterpreterContext,generate:(systemPrompt:string,messages:{role:'user';content:string}[])=>Promise<string>):Promise<Proposal>;
