import { lazy, Suspense, useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Cursor from "./components/Cursor";
import LikeButton from "./components/LikeButton";
import { observeSections, trackPageview } from "./lib/analytics";
import Loader from "./components/Loader";
import Nav from "./components/Nav";
import Home from "./pages/Home";
import ProjectsPage from "./pages/ProjectsPage";

const AdminPage = lazy(() => import("./pages/admin/AdminPage"));

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" }), 60);
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  const { pathname } = useLocation();
  // preloader shudhu Home e prothom load e
  const [booting, setBooting] = useState(pathname === "/");
  useEffect(() => {
    if (!booting) document.documentElement.classList.add("ready");
  }, [booting]);
  // anonymous visit tracking (admin e dekhao jay)
  useEffect(() => {
    trackPageview(pathname);
    const t = setTimeout(observeSections, 1500);
    return () => clearTimeout(t);
  }, [pathname]);
  return (
    <>
      {booting && <Loader onDone={() => setBooting(false)} />}
      {!pathname.startsWith("/admin") && <Cursor />}
      {!pathname.startsWith("/admin") && <LikeButton target="site" />}
      <ScrollManager />
      {!pathname.startsWith("/admin") && <Nav />}
      <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Home />} />
      </Routes>
      </Suspense>
    </>
  );
}
