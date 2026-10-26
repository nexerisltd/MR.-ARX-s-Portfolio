import { lazy, Suspense, useState } from "react";
import Hero from "../components/Hero";
import SectionRail from "../components/SectionRail";
import { About, Ambient, Contact, Footer, Marquee, Skills, Studio, Timeline, Work } from "../components/Sections";
import { useSettings } from "../lib/SettingsContext";

const Stage = lazy(() => import("../components/Stage"));

export default function Home() {
  const { settings: s } = useSettings();
  const [failed, setFailed] = useState(false);
  const useStage = !!s.character.model && !failed;
  return (
    <>
      <Ambient />
      <SectionRail />
      {useStage && (
        <Suspense fallback={null}>
          <Stage cfg={s.character} onFail={() => setFailed(true)} />
        </Suspense>
      )}
      <main className="main">
        <Hero embedded={!useStage} />
        <Marquee />
        <About />
        <Skills />
        <Timeline />
        <Work />
        <Studio />
        <Contact />
        <Footer />
      </main>
    </>
  );
}
