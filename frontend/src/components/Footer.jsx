import React from 'react';

export default function Footer() {
    return (
        <footer className="w-full py-12 px-container-padding bg-surface-container-highest border-t border-outline-variant/20">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
                <div className="space-y-4">
                    <span className="font-display-lg text-display-lg font-bold text-on-surface">Unsaid Wall</span>
                    <p className="max-w-xs text-on-surface-variant text-sm">A sanctuary for your unspoken thoughts. Professional support when you're ready to speak.</p>
                </div>
                <div className="grid grid-cols-2 gap-12">
                    <div className="space-y-3">
                        <h4 className="font-bold text-primary text-sm uppercase tracking-widest">Support</h4>
                        <a href="#" className="block text-sm text-on-surface-variant hover:text-primary">Crisis Resources</a>
                        <a href="#" className="block text-sm text-on-surface-variant hover:text-primary">Contact Us</a>
                    </div>
                    <div className="space-y-3">
                        <h4 className="font-bold text-primary text-sm uppercase tracking-widest">Legal</h4>
                        <a href="#" className="block text-sm text-on-surface-variant hover:text-primary">Privacy Policy</a>
                        <a href="#" className="block text-sm text-on-surface-variant hover:text-primary">Terms of Service</a>
                    </div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-outline-variant/10 text-center text-sm text-on-surface-variant">
                © 2024 Unsaid Wall. In partnership with Surat Psychology Club.
            </div>
        </footer>
    );
}