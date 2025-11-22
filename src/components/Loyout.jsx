// components/Layout.jsx
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import '../styles/loyout.css';
export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {/* Espaciador para compensar el header fijo */}
      <div className="header-spacer"></div>
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    
    </div>
  );
}
