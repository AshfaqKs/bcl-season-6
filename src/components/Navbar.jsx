import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const allLinks = [
        { name: 'Home', path: '/' },
        { name: 'Matches', path: '/matches' },
        { name: 'Players', path: '/players' },
        { name: 'Teams', path: '/teams' },
        { name: 'Leaderboard', path: '/leaderboard' },
        { name: 'Goals', path: '/top-scorers' },
        { name: 'Assists', path: '/top-assists' },
        { name: 'Walls', path: '/clean-sheets' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <nav className={`sticky top-0 z-[100] transition-all duration-500 ${scrolled ? 'py-2' : 'py-4'}`}>
            <div className="container mx-auto px-4">
                <div className={`relative flex justify-between items-center px-6 h-20 rounded-[30px] transition-all duration-500 border border-white/5 shadow-2xl overflow-hidden ${scrolled ? 'bg-navy-dark/80 backdrop-blur-2xl' : 'bg-navy-light/40 backdrop-blur-lg'}`}>

                    {/* Background Glow */}
                    <div className="absolute top-0 left-1/4 w-64 h-full bg-primary/5 blur-[80px] pointer-events-none"></div>

                    {/* Logo Area */}
                    <Link to="/" className="flex items-center group relative z-10 shrink-0">
                        <img 
                            src="https://i.ibb.co/1YqYmgBP/BCL-S6.jpg" 
                            alt="BCL S6" 
                            className="h-12 w-auto object-contain rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-500" 
                        />
                    </Link>

                    {/* Desktop Navigation Group */}
                    <div className="hidden lg:flex items-center justify-end flex-grow relative z-10">
                        <div className="flex items-center space-x-0">
                            {allLinks.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`px-4 py-2 rounded-full font-black uppercase tracking-widest text-[10px] transition-all relative group ${isActive(item.path) ? 'text-primary' : 'text-gray-400 hover:text-white'}`}
                                >
                                    {item.name}
                                    {isActive(item.path) && (
                                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full shadow-[0_0_10px_#00F0FF]"></span>
                                    )}
                                </Link>
                            ))}
                        </div>

                        {/* PREMIUM STYLISH ADMIN BUTTON (Text Only) */}
                        <Link
                            to="/admin"
                            className="ml-12 group relative flex items-center justify-center bg-gradient-to-br from-primary to-primary-dim px-8 py-2.5 rounded-full font-black uppercase tracking-[0.2em] text-[10px] text-navy-dark shadow-[0_0_30px_rgba(0,240,255,0.3)] hover:shadow-primary/50 transition-all hover:scale-105 active:scale-95 shrink-0 overflow-hidden"
                        >
                            <span className="relative z-10">Admin</span>
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-[-20deg]"></div>
                        </Link>
                    </div>

                    {/* Mobile Toggle */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="lg:hidden relative z-10 w-10 h-10 flex flex-col items-center justify-center space-y-1.5"
                    >
                        <span className={`w-6 h-0.5 bg-primary transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                        <span className={`w-6 h-0.5 bg-primary transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`}></span>
                        <span className={`w-6 h-0.5 bg-primary transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
                    </button>
                </div>

                {/* Mobile Menu Overlay */}
                <div className={`lg:hidden absolute top-[100px] left-4 right-4 bg-navy-dark/95 backdrop-blur-2xl rounded-[40px] border border-white/10 p-8 shadow-[0_40px_80px_rgba(0,0,0,0.8)] transition-all duration-500 origin-top ${menuOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}>
                    <div className="flex flex-col space-y-6 max-h-[70vh] overflow-y-auto pr-4 scrollbar-hide">
                        {allLinks.map((item) => (
                            <Link
                                key={item.name}
                                to={item.path}
                                onClick={() => setMenuOpen(false)}
                                className={`text-2xl font-black uppercase italic transition-all ${isActive(item.path) ? 'text-primary translate-x-4' : 'text-white hover:text-primary'}`}
                            >
                                {item.name}
                            </Link>
                        ))}
                        <Link to="/admin" onClick={() => setMenuOpen(false)} className="pl-button-primary text-center !py-4 text-sm mt-4">
                            Admin Access
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
