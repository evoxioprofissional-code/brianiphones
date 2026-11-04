import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { VisitTracker } from "@/components/site/VisitTracker";
import { CartDrawer } from "@/components/site/CartDrawer";
import { AnnouncementBar, StorefrontTheme } from "@/components/site/StorefrontTheme";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StorefrontTheme />
      <AnnouncementBar />
      <Header />
      <main>{children}</main>
      <Footer />
      <CartDrawer />
      <VisitTracker />
    </>
  );
}
