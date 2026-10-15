import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './Home';
import About from './About';
import Example from './Example';
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      {/* Navigation Bar */}
      <nav>
        <Link to="/">Home</Link> | 
        <Link to="/about">About</Link> | 
        <Link to="/example-page">Example</Link>
      </nav>

      {/* Route Switchboard */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/example-page" element={<Example />} />
      </Routes>
    </BrowserRouter>
  );
}
