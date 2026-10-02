import {cookies} from 'next/headers';
import {config} from '../../../../lib/server';
export async function GET(req:Request){const jar=await cookies();const token=jar.get('luma_access')?.value;const c=config();if(token)await fetch(`${c.url}/auth/v1/logout`,{method:'POST',headers:{apikey:c.publishable!,Authorization:`Bearer ${token}`}});jar.delete('luma_access');jar.delete('luma_cart');return Response.redirect(new URL('/',req.url))}
