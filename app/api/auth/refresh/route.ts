import {z} from 'zod';
import {claimCart,config,configured,failure,sameOrigin,session} from '../../../../lib/server';

const schema=z.object({refresh_token:z.string().min(20)});
type TokenResponse={access_token:string;refresh_token:string;expires_in:number;user:{id:string;email?:string}};

export async function POST(req:Request){
 if(!sameOrigin(req))return failure(Error('Invalid request origin.'),403);
 if(!configured())return failure(Error('Accounts are not open yet.'));
 const parsed=schema.safeParse(await req.json());
 if(!parsed.success)return failure(Error('Your session has expired. Please sign in again.'),400);
 const c=config();
 const response=await fetch(`${c.url}/auth/v1/token?grant_type=refresh_token`,{method:'POST',headers:{apikey:c.publishable!,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:parsed.data.refresh_token})});
 if(!response.ok)return failure(Error('Your session has expired. Please sign in again.'),401);
 const data=await response.json() as TokenResponse;
 const sid=await session(req);
 const cartSession=await claimCart(sid,data.user.id);
 return Response.json({email:data.user.email,access_token:data.access_token,refresh_token:data.refresh_token,expires_in:data.expires_in,cart_session:cartSession});
}
