import {cookies} from 'next/headers';
import {z} from 'zod';
import {config,configured,db,failure,sameOrigin,session} from '../../../../lib/server';

const schema=z.object({email:z.string().trim().email().max(254),password:z.string().min(8).max(72),mode:z.enum(['signin','signup'])});
type AuthResponse={access_token?:string;expires_in?:number;user?:{id:string;email?:string};msg?:string;message?:string;error_description?:string};

export async function POST(req:Request){
 if(!sameOrigin(req))return failure(Error('Invalid request origin.'),403);
 if(!configured())return failure(Error('Accounts are not open yet.'));
 const parsed=schema.safeParse(await req.json());
 if(!parsed.success)return failure(Error('Enter a valid email and a password of at least 8 characters.'),400);
 const c=config();
 const {email,password,mode}=parsed.data;
 const endpoint=mode==='signin'?`${c.url}/auth/v1/token?grant_type=password`:`${c.url}/auth/v1/signup`;
 const response=await fetch(endpoint,{method:'POST',headers:{apikey:c.publishable!,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
 const data=await response.json() as AuthResponse;
 if(!response.ok){const message=mode==='signin'?'Email or password is incorrect.':'We could not create that account. It may already exist.';return failure(Error(message),response.status===429?429:400)}
 if(!data.access_token||!data.expires_in||!data.user){return Response.json({needs_confirmation:true,email})}
 (await cookies()).set('luma_access',data.access_token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:data.expires_in});
 const sid=await session();
 await db('rpc/claim_cart','POST',{p_session:sid,p_user:data.user.id});
 return Response.json({email:data.user.email||email});
}
