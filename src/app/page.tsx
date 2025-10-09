"use client";

import { useContext } from 'react';
import Image from 'next/image';
import { AppContext } from '@/components/app/AppContext';
import Login from '@/components/app/auth/Login';
import LogoutConfirmationDialog from '@/components/app/auth/LogoutConfirmationDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MeseroTab from '@/components/app/mesero/MeseroTab';
import CocinaTab from '@/components/app/cocina/CocinaTab';
import DeliveryTab from '@/components/app/delivery/DeliveryTab';
import JefeTab from '@/components/app/jefe/JefeTab';
import BroadcastViewer from '@/components/app/shared/BroadcastViewer';

export default function Home() {
  const { role, setRole } = useContext(AppContext);

  const handleLogout = () => {
    setRole(null);
  };

  if (!role) {
    return <Login />;
  }

  const roleNames: { [key: string]: string } = {
    mesero: 'Mesero',
    cocina: 'Cocinera',
    delivery: 'Repartidor',
    jefe: 'Jefe',
  };

  const tabsConfig = [
    { value: 'mesero', label: 'Mesero', component: <MeseroTab />, roles: ['mesero', 'jefe'] },
    { value: 'cocina', label: 'Cocina', component: <CocinaTab />, roles: ['cocina', 'jefe'] },
    { value: 'delivery', label: 'Delivery', component: <DeliveryTab />, roles: ['delivery', 'jefe'] },
    { value: 'jefe', label: 'Jefe', component: <JefeTab />, roles: ['jefe'] },
  ];

  const availableTabs = tabsConfig.filter(tab => tab.roles.includes(role));
  
  const defaultTab = role === 'jefe' ? 'jefe' : availableTabs.length > 0 ? availableTabs[0].value : '';

  return (
    <>
      <BroadcastViewer />
      <div className="p-4 sm:p-6 flex justify-center items-start min-h-screen">
        <div className="w-full max-w-5xl bg-card/80 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-8 relative">
          <div className="absolute top-4 right-4 z-10">
            <LogoutConfirmationDialog onConfirm={handleLogout} />
          </div>
          
          <header className="text-center mb-8 relative">
            <div className="flex flex-col items-center">
              <Image src="https://i.ibb.co/1YDd8bvR/Sotos-Fast-Food-Drinks.png" alt="Soto's Foods Logo" width={125} height={125} className="" />
              <h1 className="text-5xl font-bold font-headline text-[#ed1500]">Soto's Foods</h1>
              <p className="text-muted-foreground font-semibold italic">¡Tan diferentes Como Tú!</p>
            </div>
            <div className="mt-4 font-bold text-sm">Rol: {roleNames[role]}</div>
          </header>

          <main>
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className={`grid w-full ${role === 'jefe' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1'}`}>
                {availableTabs.map(tab => (
                    <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                ))}
              </TabsList>
              
              {availableTabs.map(tab => (
                <TabsContent key={tab.value} value={tab.value} className="mt-6">
                  {tab.component}
                </TabsContent>
              ))}
            </Tabs>
          </main>
        </div>
      </div>
    </>
  );
}
