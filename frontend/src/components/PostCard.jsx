import React from 'react';

export default function PostCard({ emotion, text, time, hearts, coachReplied }) {
    return (
        <article className="glass-card p-6 rounded-lg space-y-4 shadow-[0px_4px_20px_rgba(5,139,3,0.03)] border border-outline-variant/10 transition-all duration-300">
            <div className="flex justify-between items-center">
                <span className="px-3 py-1 bg-tertiary-container/30 text-on-tertiary-container rounded-full font-label-sm text-[11px] uppercase tracking-wider">
                    {emotion}
                </span>
                <span className="text-outline text-[11px] font-label-sm">{time}</span>
            </div>
            <p className="font-body-lg text-on-surface leading-relaxed">"{text}"</p>
            <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-4 text-on-surface-variant">
                    <button className="flex items-center gap-1.5 hover:text-primary transition-all">
                        <span className="material-symbols-outlined text-lg">favorite</span>
                        <span className="font-label-sm">{hearts}</span>
                    </button>
                    {coachReplied && (
                        <span className="flex items-center gap-1 text-secondary text-[11px] font-bold">
                            <span className="material-symbols-outlined text-sm">verified</span> Coach Replied
                        </span>
                    )}
                </div>
            </div>
        </article>
    );
}