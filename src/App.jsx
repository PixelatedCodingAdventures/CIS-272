import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './Home';
import About from './About';
import Example from './Example';
import MyLoans from './MyLoans';
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      {/* Navigation Bar */}
      <nav>
        <Link to="/">Home</Link> | 
        <Link to="/about">About</Link> | 
        <Link to="/example-page">Example</Link> | 
        <Link to="/my-loans">My Loans</Link>
      </nav>

      {/* Route Switchboard */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/example-page" element={<Example />} />
        <Route path="/my-loans" element={<MyLoans />} />
      </Routes>
    </BrowserRouter>
  );
}
