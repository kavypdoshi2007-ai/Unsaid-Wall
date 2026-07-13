import React from 'react';

export default function Footer() {
    return (
        <footer className="w-full shrink-0 py-12 px-6 md:px-12 bg-surface-container-highest border-t border-outline-variant/20 relative z-50">

            {/* 🌟 FIXED: Changed flex to a strict 12-column grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 w-full">

                {/* Brand Section - Takes up 5 columns on desktop */}
                <div className="md:col-span-5 lg:col-span-4 flex flex-col space-y-4">
                    <span className="font-display-lg text-2xl font-bold text-on-surface">Unsaid Wall</span>
                    {/* Removed max-w-xs and added w-full so it naturally fills the column */}
                    <p className="text-on-surface-variant text-sm leading-relaxed w-full">
                        A sanctuary for your unspoken thoughts. Professional support when you're ready to speak.
                    </p>
                </div>

                {/* Links Section - Takes up the remaining 7 columns */}
                <div className="md:col-span-7 lg:col-span-8 flex flex-col sm:flex-row gap-12 md:justify-end">

                    {/* Support Links */}
                    <div className="flex flex-col space-y-3">
                        <h4 className="font-bold text-primary text-sm uppercase tracking-widest mb-1">Support</h4>
                        <a href="#" className="text-sm text-on-surface-variant hover:text-primary transition-colors w-fit">Crisis Resources</a>
                        <a href="#" className="text-sm text-on-surface-variant hover:text-primary transition-colors w-fit">Contact Us</a>
                    </div>

                    {/* Legal Links */}
                    <div className="flex flex-col space-y-3">
                        <h4 className="font-bold text-primary text-sm uppercase tracking-widest mb-1">Legal</h4>
                        <a href="#" className="text-sm text-on-surface-variant hover:text-primary transition-colors w-fit">Privacy Policy</a>
                        <a href="#" className="text-sm text-on-surface-variant hover:text-primary transition-colors w-fit">Terms of Service</a>
                    </div>

                </div>
            </div>

            {/* Copyright Section */}
            <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-outline-variant/10 text-center text-sm text-on-surface-variant w-full">
                © 2026 Unsaid Wall. In partnership with Surat Psychology Club.
            </div>

        </footer>
    );
}
