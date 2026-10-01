export type Product={id:string;name:string;category:string;description:string;price:number;size:string;image:string;tag:string};
export const catalog:Product[]=[
{id:'dew-serum',name:'The Daily Dew',category:'Skincare',description:'A lightweight hydrating serum for a fresh, dewy finish. Make a little room for it in your morning ritual.',price:28,size:'30 ml / 1 fl oz',image:'/serum.png',tag:'DAILY ESSENTIAL'},
{id:'cloud-cream',name:'Cloud Comfort',category:'Skincare',description:'A soft, comforting face cream that leaves skin feeling beautifully moisturised. Your last step, morning and night.',price:34,size:'50 ml / 1.7 fl oz',image:'/cream.png',tag:'THE SOFT TOUCH'},
{id:'lip-veil',name:'The Lip Veil',category:'Makeup',description:'An effortless wash of rose with a glossy, cushion-soft finish. Keep one close, wherever the day takes you.',price:18,size:'10 ml / 0.34 fl oz',image:'/lip.png',tag:'A LITTLE COLOUR'}
];
export const money=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
