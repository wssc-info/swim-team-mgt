'use client';

import {useAuth} from "@/lib/auth-context";
import LoginPage from "@/app/login/page";
import Image from "next/image";

export default function Home() {
  const {user} = useAuth();

  if (!user) {
    return <LoginPage/>;
  }
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-center mb-8">
        Swim Team Management System
      </h1>


      <div>
        <Image src={'/stm-logo.png'} alt={'Swim Team Management Logo'}
               width={300} height={300}
               style={{marginLeft: 'auto', marginRight: 'auto'}}/>
      </div>
    </div>
  );

}
