import { supabase } from "@/lib/supabase/client";

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Stats from "@/components/Stats";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import DashboardPreview from "@/components/DashboardPreview";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  console.log(supabase);
  
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <DashboardPreview />
      <Stats />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </>
  );
}