import Link from 'next/link';
import {Package,ChevronLeft} from 'lucide-react';
import {db,identity} from '../../lib/server';
import {money} from '../../lib/catalog';

type OrderItem={product_id:string;name:string;price:number;quantity:number};
type Order={id:string;created_at:string;total:number;status:string;payment_status:string;email_status:string;items:OrderItem[]};

export const dynamic='force-dynamic';

export default async function AccountPage(){
 const user=await identity();
 const orders=user?await db<Order[]>(`orders?user_id=eq.${user.id}&select=id,created_at,total,status,payment_status,email_status,items&order=created_at.desc`):[];
 return <>
  <div className="announcement">A little care, every day. <span>Your orders, all in one place.</span></div>
  <header>
   <Link className="wordmark" href="/">LUMA<span>EVERYDAY BEAUTY</span></Link>
   <nav><Link href="/#collection">Shop all</Link><Link href="/?category=skincare#collection">Skincare</Link><Link href="/?category=lips#collection">Makeup</Link></nav>
   <div className="header-actions"><Link className="account-header-link" href="/">Continue shopping</Link></div>
  </header>
  <main className="account-page">
   <Link className="back" href="/"><ChevronLeft size={16}/>Back to the shop</Link>
   <section className="account-hero">
    <div><p className="eyebrow">YOUR LITTLE BEAUTY SPACE</p><h1>{user?'Your order history.':'Welcome to LUMA.'}</h1><p>{user?<>Signed in as <strong>{user.email}</strong></>:'Sign in to keep your essentials and orders close.'}</p></div>
    {user&&<a className="text-link account-signout" href="/api/auth/logout">Sign out</a>}
   </section>
   {!user?<section className="account-empty"><Package size={38}/><h2>Your orders are waiting.</h2><p>Sign in to see previous purchases and their confirmation status.</p><a className="google account-google" href="/api/auth/google?next=/account"><b>G</b>Continue with Google</a><Link className="text-link" href="/?account=1">Sign in with email</Link></section>
   :orders.length===0?<section className="account-empty"><Package size={38}/><h2>No orders yet.</h2><p>When you place an order while signed in, it will appear here.</p><Link className="button" href="/#collection">Explore the collection</Link></section>
   :<section className="order-history" aria-label="Order history">{orders.map(order=><article className="order-card" key={order.id}>
     <div className="order-card-head"><div><p className="eyebrow">ORDER {order.id.slice(0,8).toUpperCase()}</p><h2>{new Intl.DateTimeFormat('en',{dateStyle:'long'}).format(new Date(order.created_at))}</h2></div><span className="order-status">{order.status==='confirmed'?'Confirmed':order.status}</span></div>
     <div className="order-lines">{order.items.map((item,index)=><div className="order-line" key={`${item.product_id}-${index}`}><span>{item.name} <small>× {item.quantity}</small></span><b>{money(item.price*item.quantity/100)}</b></div>)}</div>
     <div className="order-card-foot"><div><span>Payment</span><strong>{order.payment_status==='due_on_delivery'?'Pay on delivery':order.payment_status}</strong></div><div><span>Email</span><strong>{order.email_status==='sent'?'Confirmation sent':order.email_status==='failed'?'Saved · email pending':'Processing'}</strong></div><p>Total <strong>{money(order.total/100)}</strong></p></div>
    </article>)}</section>}
  </main>
  <footer><Link className="wordmark" href="/">LUMA<span>EVERYDAY BEAUTY</span></Link><p>Little rituals. Lasting moments.</p><span>© {new Date().getFullYear()} LUMA Beauty</span></footer>
 </>
}
