import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import ServicesSection from "../components/ServicesSection";
import DoctorsSection from "../components/DoctorsSection";
import PricingSection from "../components/PricingSection";
import TestimonialsSection from "../components/TestimonialsSection";
import FAQSection from "../components/FAQSection";
import CtaBanner from "../components/CtaBanner";
import { api, formatApiError } from "../api/client";

function useCollection(path) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api
      .get(path)
      .then((res) => {
        if (active) setData(res.results ?? res);
      })
      .catch((err) => {
        if (active) setError(formatApiError(err, "Couldn't load this section."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [path]);

  return { data, loading, error };
}

export default function Landing() {
  const services = useCollection("/services/");
  const doctors = useCollection("/doctors/");
  const plans = useCollection("/pricing-plans/");
  const testimonials = useCollection("/testimonials/");
  const faqs = useCollection("/faqs/");

  return (
    <div>
      <Navbar />
      <Hero />
      <ServicesSection services={services.data} loading={services.loading} error={services.error} />
      <DoctorsSection doctors={doctors.data} loading={doctors.loading} error={doctors.error} />
      <PricingSection plans={plans.data} loading={plans.loading} error={plans.error} />
      <TestimonialsSection
        testimonials={testimonials.data}
        loading={testimonials.loading}
        error={testimonials.error}
      />
      <FAQSection faqs={faqs.data} loading={faqs.loading} error={faqs.error} />
      <CtaBanner />
      <Footer />
    </div>
  );
}
