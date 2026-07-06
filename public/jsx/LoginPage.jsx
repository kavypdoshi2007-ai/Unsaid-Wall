import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
    const navigate = useNavigate();

    // Step 1: Auth, Step 2: Password, Step 3: Identity
    const [step, setStep] = useState(1);

    // Step 1 States
    const [authMode, setAuthMode] = useState('register');
    const [loginPassword, setLoginPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneError, setPhoneError] = useState('');

    // Step 2 States
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Step 3 States
    const names = [
        'Quiet Willow', 'Gentle Rain', 'Hidden Forest', 'Morning Mist',
        'Starlit Path', 'Silent Peak', 'Emerald Leaf', 'Soft Echo',
        'Calm River', 'Wandering Breeze', 'Golden Shore', 'Kindred Spirit',
        'Lone Oak', 'Silver Cloud', 'Amber Sky', 'Velvet Moss'
    ];
    const [generatedName, setGeneratedName] = useState('Quiet Willow');
    const [isShuffling, setIsShuffling] = useState(false);

    // --- Handlers ---
    const handleAuthSubmit = (e) => {
        e.preventDefault();
        setPhoneError('');

        const cleanPhone = phoneNumber.replace(/\D/g, '');

        if (!cleanPhone) {
            setPhoneError("Phone number is required.");
            return;
        }

        if (cleanPhone.length !== 10) {
            setPhoneError("Please enter a valid 10-digit phone number.");
            return;
        }

        if (authMode === 'register') {
            setStep(2);
        } else {
            if (loginPassword === 'coach123@') {
                navigate('/coach-dashboard');
            } else if (loginPassword === 'admin123@') {
                navigate('/admin-dashboard');
            } else {
                navigate('/user-wall');
            }
        }
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (checkLength && checkNumber && checkSymbol && checkMatch) {
            setStep(3);
        }
    };

    const shuffleName = () => {
        setIsShuffling(true);
        setTimeout(() => {
            let newName = generatedName;
            while (newName === generatedName) {
                newName = names[Math.floor(Math.random() * names.length)];
            }
            setGeneratedName(newName);
            setIsShuffling(false);
        }, 200);
    };

    const completeSetup = () => {
        localStorage.setItem('unsaid_user_name', generatedName);
        navigate('/user-wall');
    };

    // --- Password Validation Logic ---
    const checkLength = password.length >= 8;
    const checkNumber = /\d/.test(password);
    const checkSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const checkMatch = password === confirmPassword && password.length > 0;

    let score = 0;
    if (checkLength) score += 33;
    if (checkNumber) score += 33;
    if (checkSymbol) score += 34;

    let meterColor = 'bg-error';
    if (score > 33 && score <= 66) meterColor = 'bg-tertiary-container';
    if (score > 66) meterColor = 'bg-primary';

    const handlePhoneChange = (e) => {
        setPhoneNumber(e.target.value);
        if (phoneError) setPhoneError('');
    };

    return (
        <div className="font-body-md text-on-background min-h-screen flex flex-col overflow-x-hidden bg-background">
            {/* Background Effects */}
            {step === 1 && <div className="fixed w-[80vw] h-[80vh] bg-[radial-gradient(circle,rgba(125,241,104,0.15)_0%,rgba(223,255,222,0)_70%)] -z-10 -top-[20%] -left-[10%] blur-[60px]"></div>}
            {step === 3 && (
                <>
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary-container/30 rounded-full blur-3xl animate-[float_6s_ease-in-out_infinite]"></div>
                    <div className="absolute top-1/2 -right-32 w-80 h-80 bg-tertiary-container/20 rounded-full blur-3xl animate-[float_6s_ease-in-out_infinite] delay-1000"></div>
                </>
            )}

            {/* Header */}
            <header className="fixed top-0 w-full z-50 flex justify-center items-center h-20 px-container-padding">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-3xl">spa</span>
                    <span className="font-display-lg-mobile text-primary tracking-tight">Unsaid Wall</span>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-grow flex items-center justify-center p-gutter sm:p-container-padding pt-24 pb-12 z-10">

                {/* STEP 1: AUTHENTICATION */}
                {step === 1 && (
                    <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 rounded-xl overflow-hidden shadow-2xl shadow-primary/10 bg-white/40 backdrop-blur-2xl border border-white/30">
                        {/* Left Narrative Side */}
                        <div className="hidden md:flex flex-col justify-between p-12 bg-primary/5 relative overflow-hidden group">
                            <div className="z-10">
                                <h1 className="font-display-lg text-primary mb-4">Unsaid Wall</h1>
                                <p className="font-headline-md text-on-surface-variant leading-relaxed opacity-90">
                                    A sanctuary for thoughts that need a soft place to land.
                                </p>
                            </div>
                            <div className="relative z-10 space-y-6 mt-12">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <span className="material-symbols-outlined text-primary">verified_user</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-primary">Absolute Anonymity</h3>
                                        <p className="text-on-surface-variant text-sm">Your identity remains yours. We don't store personal profiles, just the words you choose to share.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute inset-0 z-0">
                                <img className="w-full h-full object-cover opacity-20 mix-blend-overlay group-hover:scale-105 transition-transform duration-1000" alt="Forest" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlmbuic_J0xLUQNX44axxVxJExA6wf00JpAvrfdnx6elN_g13C81NSqx4yL6kuxDNfFOFW_W-ov56tfG7glKBX5sqS8i-k79qEG1yvs0oCDC93wtvp1CJPIpGqfdnuQ7vUVrrfF0hOTsWLoExXnJp0tP_oTu4v2rQ3YdTzCZkHf27uEtP5xqQTc7Haewpqz-cbE2mHRAvm_kwamH-JXr_bza_iLkbPbo4ZIyWRBSnKbF0CuWx5dVxjwY9ESuF4xpY8c46GhrAfghGf" />
                            </div>
                        </div>

                        {/* Right Form Side */}
                        <div className="p-8 sm:p-12 bg-surface-container-lowest flex flex-col">
                            <div className="flex-grow space-y-8">
                                <div className="flex items-center gap-8 mb-10 border-b border-outline-variant/10">
                                    <button
                                        type="button"
                                        onClick={() => { setAuthMode('login'); setPhoneError(''); }}
                                        className={`pb-4 font-body-md transition-all ${authMode === 'login' ? 'text-primary border-b-2 border-primary font-bold' : 'text-on-surface-variant'}`}>
                                        Login
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setAuthMode('register'); setPhoneError(''); }}
                                        className={`pb-4 font-body-md transition-all ${authMode === 'register' ? 'text-primary border-b-2 border-primary font-bold' : 'text-on-surface-variant'}`}>
                                        Register
                                    </button>
                                </div>

                                <div>
                                    <h2 className="font-headline-md text-on-surface mb-2">
                                        {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
                                    </h2>
                                    <p className="text-on-surface-variant text-sm">
                                        {authMode === 'login' ? 'Verify your identity to enter your safe space.' : 'Enter your phone number to get started.'}
                                    </p>
                                </div>

                                <form className="space-y-4" onSubmit={handleAuthSubmit}>
                                    <div className="group relative">
                                        <label className="block font-label-sm text-on-surface-variant mb-2 px-1">Phone Number</label>
                                        <div className="flex gap-2">
                                            {/* STATIC COUNTRY CODE */}
                                            <div className="flex items-center justify-center px-4 bg-surface-container-highest border border-outline-variant/30 rounded-lg text-on-surface-variant font-bold select-none h-12 shrink-0">
                                                🇮🇳 +91
                                            </div>
                                            <input
                                                className={`flex-grow w-full h-12 rounded-lg bg-surface px-4 placeholder:text-outline-variant outline-none transition-all ${phoneError ? 'border-2 border-error/50 focus:border-error' : 'border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20'}`}
                                                placeholder="000 000 0000"
                                                type="tel"
                                                autoComplete="off"
                                                value={phoneNumber}
                                                onChange={handlePhoneChange}
                                            />
                                        </div>
                                        {phoneError && (
                                            <p className="text-error text-xs font-semibold mt-2 px-1 flex items-center gap-1 absolute -bottom-5">
                                                <span className="material-symbols-outlined text-[14px]">error</span>
                                                {phoneError}
                                            </p>
                                        )}
                                    </div>

                                    {authMode === 'login' && (
                                        <div className="group mt-8">
                                            <label className="block font-label-sm text-on-surface-variant mb-2 px-1">Password</label>
                                            <div className="relative">
                                                <input
                                                    required
                                                    value={loginPassword}
                                                    onChange={(e) => setLoginPassword(e.target.value)}
                                                    className="w-full h-12 rounded-lg border-primary/20 bg-surface px-4 placeholder:text-outline-variant outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                    placeholder="Enter your password"
                                                    type="password"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <button type="submit" className={`w-full h-12 bg-primary text-on-primary font-bold rounded-full hover:shadow-lg active:scale-95 transition-all cursor-pointer ${authMode === 'register' ? 'mt-8' : 'mt-4'}`}>
                                        {authMode === 'login' ? 'Login' : 'Continue'}
                                    </button>
                                </form>
                            </div>

                            {/* Safety Box */}
                            <div className="p-3 rounded-xl bg-primary-container/20 border border-primary/20 flex gap-3 items-center mt-6">
                                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
                                <div>
                                    <h4 className="font-bold text-primary text-sm">Safety First</h4>
                                    <p className="text-on-surface-variant text-xs leading-tight mt-0.5">
                                        We use military-grade AES-256 encryption. Your phone number is only used for verification and is never shared.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: PASSWORD SETUP (WITH TOP-1/2 CENTERING) */}
                {step === 2 && (
                    <div className="w-full max-w-[480px]">
                        <div className="bg-white/40 backdrop-blur-2xl rounded-lg p-8 md:p-10 border border-outline-variant/20 shadow-sm shadow-primary/5">
                            <div className="mb-8 text-center">
                                <h1 className="font-headline-md text-on-surface mb-2">Secure your account</h1>
                                <p className="font-body-md text-on-surface-variant opacity-80">Create a password to keep your unsaid words safe</p>
                            </div>
                            <form className="space-y-6" onSubmit={handlePasswordSubmit}>

                                <div className="space-y-2">
                                    <label className="block font-label-sm text-on-surface-variant ml-1">New Password</label>
                                    <div className="relative group">
                                        <input
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            type={showPassword ? "text" : "password"}
                                            className="w-full bg-surface-container-lowest/50 border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-lg py-3.5 pl-4 pr-12 outline-none transition-all placeholder:text-outline/50"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors focus:outline-none cursor-pointer flex items-center"
                                        >
                                            <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Strength Meter */}
                                <div className="space-y-3">
                                    <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                                        <div className={`h-full transition-all duration-300 ${meterColor}`} style={{ width: `${score}%` }}></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                        <div className={`flex items-center gap-2 text-label-sm transition-colors ${checkLength ? 'text-primary' : 'text-on-surface-variant/60'}`}>
                                            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: checkLength ? "'FILL' 1" : "'FILL' 0" }}>check_circle</span> 8+ characters
                                        </div>
                                        <div className={`flex items-center gap-2 text-label-sm transition-colors ${checkNumber ? 'text-primary' : 'text-on-surface-variant/60'}`}>
                                            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: checkNumber ? "'FILL' 1" : "'FILL' 0" }}>check_circle</span> One number
                                        </div>
                                        <div className={`flex items-center gap-2 text-label-sm transition-colors ${checkSymbol ? 'text-primary' : 'text-on-surface-variant/60'}`}>
                                            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: checkSymbol ? "'FILL' 1" : "'FILL' 0" }}>check_circle</span> One symbol
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block font-label-sm text-on-surface-variant ml-1">Confirm Password</label>
                                    <div className="relative group">
                                        <input
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            type={showConfirmPassword ? "text" : "password"}
                                            className="w-full bg-surface-container-lowest/50 border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-lg py-3.5 pl-4 pr-12 outline-none transition-all placeholder:text-outline/50"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors focus:outline-none cursor-pointer flex items-center"
                                        >
                                            <span className="material-symbols-outlined">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                                        </button>
                                    </div>

                                    <div className={`mt-2 flex items-center gap-2 text-label-sm transition-colors ${checkMatch ? 'text-primary' : 'text-on-surface-variant/60'}`}>
                                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: checkMatch ? "'FILL' 1" : "'FILL' 0" }}>check_circle</span> Passwords match
                                    </div>
                                </div>

                                <button
                                    disabled={score !== 100 || !checkMatch}
                                    type="submit"
                                    className="block w-full bg-primary hover:bg-primary-dim text-on-primary font-bold py-4 rounded-full shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 mt-4 disabled:opacity-50 disabled:pointer-events-none text-center cursor-pointer">
                                    Set Password
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* STEP 3: CHOOSE IDENTITY */}
                {step === 3 && (
                    <div className="max-w-[720px] w-full flex flex-col justify-center relative z-10">
                        <div className="text-center mb-10">
                            <h2 className="font-headline-md text-on-surface mb-3">Choose your Wall name</h2>
                            <p className="font-body-md text-on-surface-variant max-w-[280px] mx-auto">
                                This is how you will appear on the Wall. Stay anonymous, stay safe.
                            </p>
                        </div>

                        <div className="bg-white/40 backdrop-blur-xl rounded-xl p-8 mb-10 text-center shadow-[0px_20px_40px_rgba(5,139,3,0.06)] border border-white/50">
                            <div className="mb-2">
                                <span className="font-label-sm text-primary uppercase tracking-widest opacity-60">Your Identity</span>
                            </div>
                            <div className="py-6 min-h-[100px] flex items-center justify-center">
                                <h3 className={`font-display-lg text-primary tracking-tight transition-all duration-300 ${isShuffling ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
                                    {generatedName}
                                </h3>
                            </div>
                            <button
                                onClick={shuffleName}
                                className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-surface-container-low text-primary font-label-sm hover:bg-surface-container-high transition-all active:scale-95 group cursor-pointer">
                                <span className="material-symbols-outlined group-active:rotate-180 transition-transform duration-500">refresh</span>
                                Shuffle Name
                            </button>
                        </div>

                        <div className="mt-auto relative z-10">
                            <button
                                onClick={completeSetup}
                                className="w-full py-5 bg-surface-container-lowest text-primary rounded-full font-label-sm text-[16px] shadow-lg shadow-primary/10 hover:bg-surface-container-low active:scale-[0.98] transition-all mb-8 cursor-pointer">
                                Complete Setup
                            </button>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}