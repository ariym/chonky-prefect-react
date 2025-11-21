import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import FileBrowser from "@/FileBrowser";
import JobsTable from "@/JobsTable";

export default function App() {
  return (
    <BrowserRouter basename="/">

      <AppHeader />

      <Routes>
        <Route path="/" element={<FileBrowser />} />
        <Route path="/files/*" element={<FileBrowser />} />
        <Route path="/jobs" element={<JobsTable />} />
      </Routes>

    </BrowserRouter>
  );
}