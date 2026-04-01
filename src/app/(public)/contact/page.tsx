'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div>
      <section className="pt-28 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-4">Contact</p>
          <h1 className="font-display font-bold text-black tracking-tight leading-[1.05] type-grow cursor-default" style={{ fontSize: 'clamp(32px, 5vw, 64px)' }}>Get in touch.</h1>
          <p className="text-sm text-gray-500 max-w-xl mt-6 leading-relaxed">Have a question or partnership proposal? <Link href="/join" className="link-draw text-black inline-block">Or join the registry directly &rarr;</Link></p>
        </div>
      </section>
      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
          <div>
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-2">Name</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="w-full border-b border-gray-200 px-0 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-transparent" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-2">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required className="w-full border-b border-gray-200 px-0 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-transparent" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-2">Message</label>
                  <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={5} required className="w-full border-b border-gray-200 px-0 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-transparent resize-none" />
                </div>
                <button type="submit" className="btn-ink text-xs tracking-[0.15em] uppercase px-8 py-3 mt-4">Send Message</button>
              </form>
            ) : (
              <div className="py-12">
                <h2 className="font-display text-2xl font-bold text-black mb-3">Message sent.</h2>
                <p className="text-sm text-gray-500">Thank you, {form.name.split(' ')[0]}. We&apos;ll get back to you soon.</p>
                <Link href="/" className="link-draw text-xs text-gray-500 mt-6 inline-block hover:text-black transition-colors">Back to home &rarr;</Link>
              </div>
            )}
          </div>
          <div className="space-y-10 pt-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-2">Email</p>
              <p className="text-sm text-black type-breathe">info@thekgang.org.za</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-2">Board Contact</p>
              <p className="text-sm text-black">Melvin Kaabwe, Secretary &amp; Spokesperson</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-2">Mandate</p>
              <p className="text-sm text-gray-600">Book Publishing, Manufacturing &amp; Distribution Cluster</p>
              <Link href="/about" className="link-draw text-[10px] text-gray-500 mt-2 inline-block hover:text-black transition-colors">Read our full story &rarr;</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
