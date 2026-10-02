import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {StoreProvider} from '../lib/store';

export default function Layout(){return <StoreProvider><StatusBar style="dark"/><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:'#fbf9f6'}}}><Stack.Screen name="index"/><Stack.Screen name="checkout" options={{presentation:'modal'}}/></Stack></StoreProvider>}
