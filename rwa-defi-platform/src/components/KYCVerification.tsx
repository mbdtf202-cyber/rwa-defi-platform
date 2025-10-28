import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function KYCVerification() {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const steps = [
    { id: 1, title: 'Personal Information', completed: true },
    { id: 2, title: 'Document Upload', completed: step > 2 },
    { id: 3, title: 'Verification', completed: step > 3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 px-4">
      <div className="max-w-4xl mx-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">KYC Verification</h1>
          <p className="text-gray-400">Complete your identity verification to start investing</p>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-12">
          {steps.map((s, index) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    s.completed
                      ? 'bg-green-500'
                      : step === s.id
                      ? 'bg-purple-600'
                      : 'bg-gray-700'
                  }`}
                >
                  {s.completed ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : (
                    <span className="text-white font-bold">{s.id}</span>
                  )}
                </div>
                <p className="text-white text-sm mt-2">{s.title}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-4 ${s.completed ? 'bg-green-500' : 'bg-gray-700'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20"
        >
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Personal Information</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400"
                />
                <input
                  type="text"
                  placeholder="Phone Number"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400"
                />
                <input
                  type="text"
                  placeholder="Address"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400"
                />
                <button
                  onClick={() => setStep(2)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Document Upload</h2>
              <div className="space-y-6">
                <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-white mb-2">Upload Government ID</p>
                  <p className="text-gray-400 text-sm mb-4">Passport, Driver's License, or National ID</p>
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors">
                    Choose File
                  </button>
                </div>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-white mb-2">Upload Proof of Address</p>
                  <p className="text-gray-400 text-sm mb-4">Utility bill or bank statement (less than 3 months old)</p>
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors">
                    Choose File
                  </button>
                </div>
                <button
                  onClick={() => setStep(3)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Submit Documents
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-8">
              <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Verification in Progress</h2>
              <p className="text-gray-400 mb-8">
                Your documents are being reviewed. This usually takes 1-2 business days.
              </p>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-400">We'll notify you via email once verification is complete</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
