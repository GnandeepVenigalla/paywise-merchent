import React, { useState } from 'react';
import { Store, Camera, ArrowRight, ShieldCheck } from 'lucide-react';

const Onboarding = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [shopName, setShopName] = useState('');
    const [phone, setPhone] = useState('');

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
        else onComplete({ shopName, phone });
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#fdf6e3] p-6 items-center justify-center">
            {step === 1 && (
                <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="w-24 h-24 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border-2 border-amber-200">
                        <Store size={48} className="text-amber-800" />
                    </div>
                    <h1 className="text-3xl font-bold text-amber-900 mb-4">Welcome, Merchant!</h1>
                    <p className="text-amber-800 mb-8 opacity-80">Transform your shop into a digital business in seconds.</p>
                    
                    <button 
                        onClick={handleNext}
                        className="w-full bg-amber-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-200"
                    >
                        Get Started <ArrowRight size={20} />
                    </button>
                    <p className="mt-4 text-xs text-amber-700">100,000+ shops already use Paywise</p>
                </div>
            )}

            {step === 2 && (
                <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-2xl font-bold text-amber-900 mb-2">Build Your Identity</h2>
                    <p className="text-amber-800 mb-8 opacity-80">What is your shop called?</p>
                    
                    <div className="space-y-6">
                        <div className="relative">
                            <label className="text-xs font-bold text-amber-700 uppercase mb-2 block">Shop Name</label>
                            <input 
                                type="text" 
                                value={shopName}
                                onChange={(e) => setShopName(e.target.value)}
                                placeholder="e.g. Ramesh General Store" 
                                className="w-full bg-white border-2 border-amber-100 p-4 rounded-2xl focus:border-amber-400 focus:outline-none text-lg font-medium shadow-sm"
                            />
                        </div>

                        <div className="relative">
                            <label className="text-xs font-bold text-amber-700 uppercase mb-2 block">Shop Photo (Optional)</label>
                            <div className="w-full aspect-video bg-amber-50 border-2 border-dashed border-amber-200 rounded-2xl flex flex-col items-center justify-center text-amber-400 hover:bg-amber-100 transition-colors cursor-pointer">
                                <Camera size={40} />
                                <span className="text-sm mt-2">Tap to take a photo</span>
                            </div>
                        </div>

                        <button 
                            onClick={handleNext}
                            disabled={!shopName}
                            className={`w-full py-4 rounded-2xl font-bold transition-all shadow-lg ${shopName ? 'bg-amber-900 text-white shadow-amber-200' : 'bg-amber-100 text-amber-300'}`}
                        >
                            Next Step
                        </button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck size={40} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-amber-900 mb-4">Almost Ready!</h2>
                    <p className="text-amber-800 mb-8 opacity-80">We've secured your shop's digital khata. You can now start adding customers.</p>
                    
                    <div className="bg-white p-6 rounded-3xl border-2 border-amber-50 mb-8 shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-amber-900 text-white rounded-xl flex items-center justify-center font-bold">
                                {shopName[0]}
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-amber-900">{shopName}</div>
                                <div className="text-xs text-amber-500">Digital Merchant Badge Active</div>
                            </div>
                        </div>
                        <div className="flex justify-between text-xs font-mono text-amber-400">
                             <span>ID: PW-MB-2026</span>
                             <span>VERIFIED</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleNext}
                        className="w-full bg-amber-900 text-white py-4 rounded-2xl font-bold shadow-lg shadow-amber-200"
                    >
                        Enter Dashboard
                    </button>
                </div>
            )}
        </div>
    );
};

export default Onboarding;
