import { Route, Routes } from "react-router-dom";
import TopNav from "./components/TopNav.jsx";
import Footer from "./components/Footer.jsx";
import AddSpecies from "./pages/AddSpecies.jsx";
import Directory from "./pages/Directory.jsx";
import SpeciesDetail from "./pages/SpeciesDetail.jsx";
import SpeciesTable from "./pages/SpeciesTable.jsx";
import AddImage from "./pages/AddImage.jsx";
import EditSpecies from "./pages/EditSpecies.jsx";

function App() {
  return (
    <div className="app-shell">
      <TopNav />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Directory />} />
          <Route path="/add-species" element={<AddSpecies />} />
          <Route path="/species/:id" element={<SpeciesDetail />} />
          <Route path="/species/:id/edit" element={<EditSpecies />} />
          <Route path="/table" element={<SpeciesTable />} />
          <Route path="/add-image" element={<AddImage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
