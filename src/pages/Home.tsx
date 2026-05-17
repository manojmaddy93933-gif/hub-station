import React from 'react';
import { motion } from 'motion/react';
import { Car, Gamepad2, Trophy, Clock, Users, ArrowRight, Coffee } from 'lucide-react';
import { Link } from 'react-router-dom';
import carWashImg from '../assets/images/car_wash_bay_vibe_1778742611946.png';
import gamesImg from '../assets/images/games_vibe_1778742630317.png';
import badmintonImg from '../assets/images/badminton_vibe_1778742647583.png';
import { Monitor } from 'lucide-react';

import { MapSection } from '../components/MapSection';

const Home = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const heroTitleVariants = {
    hidden: { opacity: 0, y: 100, rotateX: 45 },
    visible: { 
      opacity: 1, 
      y: 0, 
      rotateX: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1] // Custom cubic-bezier for a "slam" effect
      }
    }
  };

  const services = [
    {
      id: 'cafe',
      title: 'AURA Cafe',
      description: 'Gourmet menu, artisan coffee, and premium social vibes.',
      icon: <Coffee size={24} />,
      image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2047&auto=format&fit=crop',
      link: '/bookings',
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      timing: '9:00 AM - 10:00 PM'
    },
    {
      id: 'theatre',
      title: 'Birthday Theatre',
      description: 'Private luxury hall for birthdays and celebrations.',
      icon: <Monitor size={24} />,
      image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop',
      link: '/bookings',
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
      timing: '10:00 AM - 10:00 PM'
    },
    {
      id: 'games',
      title: 'Game Zone',
      description: 'Carrom, Chess, and Ludo. Book your table now.',
      icon: <Gamepad2 size={24} />,
      image: gamesImg,
      link: '/bookings',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      timing: '8:30 AM - 11:00 PM'
    },
    {
      id: 'carwash',
      title: 'Luxe Car Wash Detailing',
      description: 'Professional 2-bay service hub with real-time status.',
      icon: <Car size={24} />,
      image: carWashImg,
      link: '/bookings',
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      timing: '10:00 AM - 7:00 PM'
    },
    {
      id: 'badminton',
      title: 'Badminton Court',
      description: 'Professional court with flexible booking slots.',
      icon: <Trophy size={24} />,
      image: badmintonImg,
      link: '/bookings',
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
      timing: '7AM-11AM & 4PM-11PM'
    }
  ];

  const stats = [
    { icon: <Clock size={20} />, label: 'Fast Service', value: '15-30 min' },
    { icon: <Users size={20} />, label: 'Capacity', value: '50+ People' },
    { icon: <Trophy size={20} />, label: 'Rating', value: '4.9/5.0' },
  ];

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <section className="relative h-[80vh] overflow-hidden flex items-center">
        <div className="absolute inset-0 z-0">
          <img 
            src={carWashImg} 
            alt="Hero Background" 
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 to-transparent opacity-90" />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10 w-full">
          <motion.div 
            initial="hidden"
            animate="visible"
            className="max-w-2xl text-slate-100"
          >
            <motion.div 
              variants={{
                hidden: { opacity: 0, scale: 0.8 },
                visible: { opacity: 1, scale: 1 }
              }}
              className="flex flex-wrap gap-3 mb-8"
            >
              <div className="inline-flex items-center gap-2 bg-accent/20 backdrop-blur-md px-4 py-2 rounded-full border border-accent/30 font-bold text-accent text-xs tracking-widest uppercase">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                Now Open
              </div>
              <div className="inline-flex items-center gap-2 bg-blue-500/20 backdrop-blur-md px-4 py-2 rounded-full border border-blue-500/30 font-bold text-blue-400 text-xs tracking-widest uppercase shadow-lg shadow-blue-500/10">
                <Trophy size={14} className="animate-bounce" />
                10% Student Offer
              </div>
            </motion.div>
            
            <motion.h2 
              variants={heroTitleVariants}
              className="text-6xl md:text-8xl font-bold leading-tight mb-6 tracking-tighter uppercase perspective-1000"
            >
              Premium <br />
              <span className="text-accent italic font-black">HUB EXPERIENCE</span>
            </motion.h2>
            <motion.p 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              className="text-lg text-zinc-400 mb-10 leading-relaxed max-w-lg font-medium"
            >
              A meticulously crafted space where coffee culture meets high-end service. 
              Gourmet menu, social gaming, and professional car detailing.
            </motion.p>
            <motion.div 
              variants={{
                hidden: { opacity: 0, scale: 0.9 },
                visible: { opacity: 1, scale: 1 }
              }}
              className="flex flex-wrap gap-4"
            >
              <Link to="/bookings" className="btn-primary flex items-center gap-2">
                Book Service <ArrowRight size={20} />
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Stats overlay */}
        <div className="absolute bottom-10 right-10 hidden lg:flex gap-10 bg-zinc-900/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5">
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col gap-1 items-center">
              <div className="text-accent mb-2">{stat.icon}</div>
              <p className="text-2xl font-bold text-white tracking-tighter">{stat.value}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services Grid */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-7xl mx-auto px-4 -mt-20 relative z-20"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <motion.div
              key={service.id}
              variants={itemVariants}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className="group cursor-pointer"
            >
              <div className="bg-zinc-900 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/20 hover:border-accent/40 transition-all border border-zinc-800 p-3">
                <div className="h-44 relative overflow-hidden rounded-[2rem]">
                  <img 
                    src={service.image} 
                    alt={service.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                  <div className={`absolute top-4 right-4 ${service.bg} ${service.color} p-2.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg`}>
                    {service.icon}
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-[10px] text-accent font-black tracking-widest uppercase mb-2 flex items-center gap-2">
                     <Clock size={12} /> {service.timing}
                  </p>
                  <h3 className="font-bold text-xl mb-2 uppercase tracking-tight text-slate-100">{service.title}</h3>
                  <p className="text-zinc-500 text-xs mb-6 line-clamp-2 leading-loose font-medium">
                    {service.description}
                  </p>
                  <Link 
                    to={service.link}
                    className="flex items-center justify-between font-black text-[10px] tracking-widest text-zinc-400 group-hover:text-accent transition-colors uppercase"
                  >
                    SELECT SERVICE <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Info Section */}
      <section className="max-w-7xl mx-auto px-4 mt-32">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-zinc-900 rounded-[3.5rem] p-12 md:p-20 relative overflow-hidden border border-zinc-800"
        >
          <div className="absolute top-0 right-0 w-1/3 h-full bg-accent opacity-5 blur-[120px]" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="w-12 h-1 text-accent bg-accent mb-8" />
              <h2 className="text-4xl md:text-5xl font-bold text-slate-100 mb-8 leading-tight tracking-tighter uppercase">
                Expert <br />Service Station
              </h2>
              <p className="text-zinc-500 mb-10 leading-relaxed text-lg font-medium">
                Equipped with high-performance bays, we deliver showroom-quality detailing. 
                Enjoy real-time tracking while you relax in our lounge.
              </p>
              <div className="space-y-6">
                {[
                  { label: 'Basic Wash', price: '₹500' },
                  { label: 'Premium Wash', price: '₹800' },
                  { label: 'Deep Clean Service', price: '₹1300' },
                ].map((item, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + (i * 0.1) }}
                    className="flex items-center justify-between border-b border-zinc-800 pb-4"
                  >
                    <span className="text-zinc-300 font-bold text-sm uppercase tracking-wider">{item.label}</span>
                    <span className="text-accent font-black text-lg italic">{item.price}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="relative"
            >
              <div className="rounded-[3rem] overflow-hidden border border-zinc-800 shadow-2xl">
                <img src={carWashImg} alt="Car Wash" className="w-full grayscale-[0.2]" />
              </div>
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="absolute -bottom-6 -left-6 bg-accent p-8 rounded-3xl text-zinc-950 shadow-2xl flex flex-col items-center"
              >
                <p className="text-4xl font-black italic">05</p>
                <p className="text-[10px] uppercase font-black tracking-widest opacity-80 mt-1">Bays / Day</p>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>
      {/* Location Map Section */}
      <MapSection />
    </div>
  );
};

export default Home;
