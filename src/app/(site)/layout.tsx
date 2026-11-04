import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { VisitTracker } from "@/components/site/VisitTracker";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <VisitTracker />
    </>
  );
}
