import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Rewards from '../pages/Rewards';
import ScanQR from '../pages/ScanQR';
import Gallery from '../pages/Gallery';
import Profile from '../pages/Profile';
import EventDetail from '../pages/EventDetail';

/**
 * All app routes – single place to add/change routes
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/rewards" element={<Rewards />} />
      <Route path="/scan" element={<ScanQR />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/event/:id" element={<EventDetail />} />
    </Routes>
  );
}
