export const catalog=[{id:'shop:cheese',name:'Cheese',aliases:['치즈'],price:2},{id:'shop:potion',name:'Potion',aliases:['물약','포션'],price:5},{id:'shop:sword',name:'Sword',aliases:['검'],price:20}];
export function decideTrade(state,proposal){
 const unchanged=(reason)=>({outcome:'FAIL',reason,proposal:{}});
 if(proposal.status!=='resolved')return unchanged(proposal.status==='needs_clarification'?proposal.question:'지원하지 않는 행동입니다.');
 const action=proposal.action,item=catalog.find(i=>i.id===action.itemId);
 if(!item)return unchanged('등록되지 않은 상품입니다.');
 if(action.type==='inspect_item')return {outcome:'SUCCESS',reason:`${item.name}의 가격은 ${item.price}골드입니다. 구매는 실행하지 않았습니다.`,proposal:{}};
 if(action.type!=='buy_item'||!Number.isSafeInteger(action.quantity)||action.quantity<1||action.quantity>99)return unchanged('구매 수량은 1~99개여야 합니다.');
 const cost=item.price*action.quantity;
 if(state.gold<cost)return unchanged(`잔액 부족: 필요 ${cost}골드, 보유 ${state.gold}골드. 거래하지 않았습니다.`);
 return {outcome:'SUCCESS',reason:`${item.name} ${action.quantity}개 구매 완료. ${cost}골드 지불.`,proposal:{gold:state.gold-cost,inventoryChanges:[{action:'acquire',id:item.id,name:item.name,quantity:action.quantity}]}};
}
export function parseNarrative(raw,speaker,outcome){
 let text=raw.trim();if(text.startsWith('```json')&&text.endsWith('```'))text=text.slice(7,-3).trim();
 let d;try{d=JSON.parse(text);}catch{return null;}
 if(!d||d.speaker!==speaker||typeof d.dialogue!=='string'||!d.dialogue.trim()||typeof d.narration!=='string'||!d.narration.trim())return null;
 if(outcome==='FAIL'&&['건넸다','손에 쥐어','주머니에 넣','성공','획득','열렸다','이동했다','알려주었다','비밀을 말'].some(k=>(d.dialogue+' '+d.narration).includes(k)))return null;
 return {speaker:d.speaker,dialogue:d.dialogue,narration:d.narration};
}
