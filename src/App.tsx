import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Nav from "./components/Nav";
import AdminPage from "./pages/admin/AdminPage";
import Home from "./pages/Home";
import ProjectsPage from "./pages/ProjectsPage";

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
  return (
    <>
      <ScrollManager />
      {!pathname.startsWith("/admin") && <Nav />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </>
  );
}
