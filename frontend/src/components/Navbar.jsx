import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar({ isLoggedIn }) {
    return (
        <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 shadow-[0_4px_20px_rgba(5,139,3,0.05)] h-16">
            <div className="flex justify-between items-center px-container-padding h-full w-full max-w-screen-xl mx-auto">
                <Link to="/" className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-3xl">spa</span>
                    <h1 className="font-display-lg text-[24px] font-bold text-primary tracking-tight">Unsaid Wall</h1>
                </Link>
                <div className="hidden md:flex items-center gap-8">
                    <Link to="/wall" className="text-on-surface-variant hover:text-primary font-medium">Wall</Link>
                    <Link to="/journal" className="text-on-surface-variant hover:text-primary font-medium">Journal</Link>
                    <Link to="/coaches" className="text-on-surface-variant hover:text-primary font-medium">Coaches</Link>
                    <Link to="/resources" className="text-on-surface-variant hover:text-primary font-medium">Resources</Link>
                </div>
                <div className="flex items-center gap-4">
                    {isLoggedIn ? (
                        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center font-bold text-on-primary-container">JD</div>
                    ) : (
                        <Link to="/login" className="px-4 py-2 bg-primary text-on-primary rounded-full font-bold text-sm">Login</Link>
                    )}
                </div>
            </div>
        </nav>
    );
}