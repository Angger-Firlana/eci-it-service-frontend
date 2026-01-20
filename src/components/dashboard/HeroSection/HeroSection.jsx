import React from 'react';
import './HeroSection.css';
import maskotImg from '../../../assets/images/maskot-eci-rmeove 1.png';

const HeroSection = ({ user }) => {
  return (
    <section className="hero">
      <h1 className="hero-title">Welcome back, {user?.name || 'User'}</h1>
      <div className="hero-subtitle">Dashboard</div>

      <div className="hero-meta">
        <span>{user?.role || 'User'}</span>
        <span>{user?.department || 'Department'}</span>
      </div>

      {/* Mascot/Robot Image */}
      <div className="hero-mascot">
        <img src={maskotImg} alt="Mascot" className="mascot-img" />
      </div>
    </section>
  );
};

export default HeroSection;
