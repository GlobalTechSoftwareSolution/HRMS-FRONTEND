"use client";
import React from "react";
import { Navbar } from "@/components/Navbar";
import  Mainpage  from "@/app/mainpage/page";
import  Footer  from "@/components/footer";
import Services from '@/app/services/page'
import Hrstandout from '@/app/hrstandout/page'
import Hrmodules from '@/app/hrmodules/page'
import Goodwill from '@/app/goodwill/page'
import Faqs from '@/app/faqs/page'
import Modules from '@/app/modules/page'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />
      <main className="flex-grow flex items-center justify-center">
        <Mainpage />
      </main>
      <Hrstandout />
      <Hrmodules />
      <Services />
      <Goodwill />
      <Modules />
      <Faqs />
      <Footer />
    </div>
  );
}
