import React from 'react';
import { Link } from 'react-router-dom';
import {
  Scale, ShieldCheck, FileSearch, AlertTriangle,
  BarChart3, MessageSquare, ArrowRight, CheckCircle2, Zap
} from 'lucide-react';

const features = [
  {
    icon: FileSearch,
    title: 'Clause Detection',
    desc: 'Automatically identifies 10+ clause types including termination, liability, IP, and arbitration.',
  },
  {
    icon: AlertTriangle,
    title: 'Risk Analysis',
    desc: 'Each clause is rated Low / Medium / High risk with a severity score and plain-English explanation.',
  },
  {
    icon: BarChart3,
    title: 'Risk Score Engine',
    desc: 'Custom-built scoring engine computes a 0–100 composite risk score based on weighted factors.',
  },
  {
    icon: MessageSquare,
    title: 'Negotiation Assistant',
    desc: 'Get safer alternatives, negotiation talking points, and modified wording for risky clauses.',
  },
  {
    icon: ShieldCheck,
    title: 'Missing Clause Alerts',
    desc: 'Instantly know if your contract is missing confidentiality, termination, or data protection clauses.',
  },
  {
    icon: Zap,
    title: 'Executive Summary',
    desc: 'Receive a clear overview with top risks, recommended actions, and a Sign / Review / Do Not Sign verdict.',
  },
];

const steps = [
  { step: '01', title: 'Upload Your Contract', desc: 'Drag and drop a PDF or DOCX file.' },
  { step: '02', title: 'AI Analysis', desc: 'Gemini AI identifies and evaluates every clause.' },
  { step: '03', title: 'Review Results', desc: 'Get your risk score, clause breakdown, and recommendations.' },
  { step: '04', title: 'Negotiate Confidently', desc: 'Use our suggestions to protect your interests.' },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-primary-950 pt-24 pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-900/20 via-transparent to-transparent" />
        <div className="max-w-5xl mx-auto px-4 text-center relative">
          <div className="inline-flex items-center gap-2 bg-primary-900/40 border border-primary-800/50 rounded-full px-4 py-1.5 text-sm text-primary-300 mb-8">
            <Zap className="w-3.5 h-3.5" />
            Powered by Google Gemini AI
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-6 leading-tight">
            Understand Every Contract<br />
            <span className="text-primary-400">Before You Sign</span>
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            LexAudit analyzes your legal contracts using AI — identifying risks, explaining clauses in plain English, and giving you negotiation leverage.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary flex items-center justify-center gap-2 text-base py-3 px-8">
              Analyze Your Contract Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="btn-secondary flex items-center justify-center gap-2 text-base py-3 px-8">
              Sign In
            </Link>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-slate-500">
            {['PDF & DOCX Support', 'AI-Powered Analysis', 'Instant Risk Score', 'No Legal Jargon'].map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary-500" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-slate-950">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Everything You Need to Review Contracts</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              A complete contract intelligence platform — not just a chatbot.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card hover:border-primary-800 transition-colors">
                <div className="bg-primary-600/10 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-slate-900">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="text-5xl font-extrabold text-primary-800 mb-3">{step}</div>
                <h3 className="text-white font-semibold mb-2">{title}</h3>
                <p className="text-slate-400 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-primary-900 to-primary-800">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Analyze Your First Contract?</h2>
          <p className="text-primary-200 mb-8">Join thousands of businesses that trust LexAudit to review their contracts.</p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-white text-primary-700 font-bold py-3 px-8 rounded-lg hover:bg-primary-50 transition-colors">
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Scale className="w-4 h-4 text-primary-500" />
            <span className="font-semibold text-white">LexAudit</span>
            <span className="text-sm">— AI Contract Risk Analyzer</span>
          </div>
          <p className="text-slate-600 text-sm">
            © {new Date().getFullYear()} LexAudit. Not a substitute for legal advice.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
