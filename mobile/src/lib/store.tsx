import {createContext,useCallback,useContext,useEffect,useRef,useState,type PropsWithChildren} from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const API='https://luma-beauty-atelier.vercel.app';
const keys={access:'luma.access',refresh:'luma.refresh',email:'luma.email',cart:'luma.cart',expires:'luma.expires'};

export type Product={id:string;name:string;category:'Skincare'|'Makeup';description:string;price:number;size:string;image:string;tag:string;brand?:string};
export type CartItem={product_id:string;quantity:number};
type AuthResult={email?:string;access_token?:string;refresh_token?:string;expires_in?:number;cart_session?:string;needs_confirmation?:boolean;error?:string};
type ShopResult={configured:boolean;products:Product[];items:CartItem[];user?:string|null;cart_session:string;cart_revision:number;error?:string};
type CartResult={items:CartItem[];revision:number;cart_session:string;error?:string};
export type CheckoutData={email:string;name:string;phone:string;address:string;city:string;postal:string;country:string};
type Store={ready:boolean;busy:boolean;products:Product[];items:CartItem[];email:string|null;notice:string;setNotice:(v:string)=>void;login:(email:string,password:string,mode:'signin'|'signup')=>Promise<boolean>;logout:()=>Promise<void>;change:(id:string,quantity:number)=>Promise<void>;checkout:(data:CheckoutData)=>Promise<{id:string;total:number;email_sent:boolean}>;refresh:()=>Promise<void>};

const Context=createContext<Store|null>(null);
const put=(key:string,value:string|null)=>value===null?SecureStore.deleteItemAsync(key):SecureStore.setItemAsync(key,value);
const money=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
export {API,money};

export function StoreProvider({children}:PropsWithChildren){
 const [ready,setReady]=useState(false),[busy,setBusy]=useState(false),[products,setProducts]=useState<Product[]>([]),[items,setItems]=useState<CartItem[]>([]),[email,setEmail]=useState<string|null>(null),[notice,setNotice]=useState('');
 const access=useRef<string|null>(null),refreshToken=useRef<string|null>(null),cart=useRef(''),expiresAt=useRef(0),revision=useRef(0);

 const saveAuth=useCallback(async(data:AuthResult)=>{access.current=data.access_token||null;refreshToken.current=data.refresh_token||null;if(data.cart_session)cart.current=data.cart_session;expiresAt.current=data.expires_in?Date.now()+data.expires_in*1000:0;setEmail(data.email||null);await Promise.all([put(keys.access,access.current),put(keys.refresh,refreshToken.current),put(keys.email,data.email||null),put(keys.cart,cart.current),put(keys.expires,String(expiresAt.current))])},[]);
 const headers=useCallback(()=>({'Content-Type':'application/json','X-Luma-Client':'mobile','X-Cart-Session':cart.current,...(access.current?{Authorization:`Bearer ${access.current}`}:{})}),[]);
 const renew=useCallback(async()=>{if(!refreshToken.current)return false;const r=await fetch(`${API}/api/auth/refresh`,{method:'POST',headers:headers(),body:JSON.stringify({refresh_token:refreshToken.current})});if(!r.ok){await saveAuth({cart_session:cart.current});return false}await saveAuth(await r.json() as AuthResult);return true},[headers,saveAuth]);
 const authorizedFetch=useCallback(async(url:string,init:RequestInit={})=>{if(refreshToken.current&&Date.now()>expiresAt.current-60000)await renew();return fetch(`${API}${url}`,{...init,headers:{...headers(),...(init.headers||{})}})},[headers,renew]);
 const loadShop=useCallback(async()=>{const r=await authorizedFetch('/api/shop');const data=await r.json() as ShopResult;if(!r.ok)throw Error(data.error||'Could not load the shop.');setProducts(data.products||[]);setItems(data.items||[]);revision.current=data.cart_revision||0;if(data.cart_session){cart.current=data.cart_session;await put(keys.cart,cart.current)}if(data.user)setEmail(data.user);else if(access.current)await saveAuth({cart_session:cart.current})},[authorizedFetch,saveAuth]);
 const refresh=useCallback(async()=>{try{await loadShop()}catch(e){setNotice(e instanceof Error?e.message:'Could not refresh the shop.')}},[loadShop]);

 useEffect(()=>{let cancelled=false;(async()=>{try{const stored=await Promise.all([SecureStore.getItemAsync(keys.access),SecureStore.getItemAsync(keys.refresh),SecureStore.getItemAsync(keys.email),SecureStore.getItemAsync(keys.cart),SecureStore.getItemAsync(keys.expires)]);if(cancelled)return;access.current=stored[0];refreshToken.current=stored[1];setEmail(stored[2]);cart.current=stored[3]||Crypto.randomUUID();expiresAt.current=Number(stored[4])||0;await put(keys.cart,cart.current);await loadShop()}catch(e){if(!cancelled)setNotice(e instanceof Error?e.message:'Could not open LUMA.')}finally{if(!cancelled)setReady(true)}})();return()=>{cancelled=true}},[loadShop]);
 useEffect(()=>{if(!ready||!email)return;let cancelled=false;let controller:AbortController|undefined;(async()=>{while(!cancelled){try{controller=new AbortController();const r=await authorizedFetch(`/api/cart?since=${revision.current}&wait=7000`,{signal:controller.signal});const data=await r.json() as CartResult;if(r.ok&&!cancelled){revision.current=data.revision||0;setItems(data.items||[])}}catch{if(!cancelled)await new Promise(resolve=>setTimeout(resolve,900))}}})();return()=>{cancelled=true;controller?.abort()}},[authorizedFetch,email,ready]);

 const login=useCallback(async(userEmail:string,password:string,mode:'signin'|'signup')=>{setBusy(true);setNotice('');try{const r=await fetch(`${API}/api/auth/password`,{method:'POST',headers:headers(),body:JSON.stringify({email:userEmail,password,mode,client:'mobile'})});const data=await r.json() as AuthResult;if(!r.ok)throw Error(data.error||'Sign-in failed.');if(data.needs_confirmation){setNotice('Check your email to confirm your LUMA account.');return false}await saveAuth(data);await loadShop();setNotice(mode==='signin'?'Welcome back.':'Your LUMA account is ready.');return true}catch(e){setNotice(e instanceof Error?e.message:'Sign-in failed.');return false}finally{setBusy(false)}},[headers,loadShop,saveAuth]);
 const logout=useCallback(async()=>{try{if(access.current)await fetch(`${API}/api/auth/logout`,{method:'POST',headers:headers()})}catch{}await saveAuth({cart_session:Crypto.randomUUID()});revision.current=0;setItems([]);await loadShop();setNotice('You are signed out.')},[headers,loadShop,saveAuth]);
 const change=useCallback(async(id:string,quantity:number)=>{setBusy(true);try{const r=await authorizedFetch('/api/cart',{method:'POST',body:JSON.stringify({product_id:id,quantity})});const data=await r.json() as CartResult;if(!r.ok)throw Error(data.error||'Could not update your bag.');revision.current=data.revision||revision.current;setItems(data.items||[])}catch(e){setNotice(e instanceof Error?e.message:'Could not update your bag.')}finally{setBusy(false)}},[authorizedFetch]);
 const checkout=useCallback(async(data:CheckoutData)=>{setBusy(true);try{const r=await authorizedFetch('/api/checkout',{method:'POST',body:JSON.stringify(data)});const result=await r.json();if(!r.ok)throw Error(result.error||'Could not place your order.');setItems([]);revision.current+=1;return result}catch(e){setNotice(e instanceof Error?e.message:'Could not place your order.');throw e}finally{setBusy(false)}},[authorizedFetch]);
 return <Context.Provider value={{ready,busy,products,items,email,notice,setNotice,login,logout,change,checkout,refresh}}>{children}</Context.Provider>
}

export function useStore(){const value=useContext(Context);if(!value)throw Error('StoreProvider is missing');return value}
