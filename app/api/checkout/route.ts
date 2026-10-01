import {z} from 'zod';
import {db,session,identity,sameOrigin,failure,sendConfirmation} from '../../../lib/server';
const text=(max:number)=>z.string().trim().min(1).max(max);
const schema=z.object({email:z.string().email().max(254),name:text(100),phone:text(30),address:text(250),city:text(100),postal:text(20),country:text(80)});
export async function POST(req:Request){if(!sameOrigin(req))return failure(Error('Invalid request origin.'),403);try{const parsed=schema.safeParse(await req.json());if(!parsed.success)return failure(Error('Please check your contact and delivery details.'),400);const sid=await session();const user=await identity();const order=await db('rpc/place_order','POST',{p_session:sid,p_customer:parsed.data,p_user:user?.id||null});const sent=order.email_status==='sent'||(order.email_status==='pending'&&await sendConfirmation(order));return Response.json({id:order.id,total:order.total,email_sent:sent})}catch(e){return failure(e)}}
