import React from "react";
import { Mail, User, Code, ExternalLink, MessageCircle, FileQuestion } from "lucide-react";

export default function HelpSupport() {
  const handleReportIssue = () => {
    const subject = encodeURIComponent("EEC Application Issue Report");
    const body = encodeURIComponent(`
Hello Kareem,

I would like to report an issue with the EEC (Employee Exit Command Center) application.

Please describe the issue below:


Steps to reproduce:
1.
2.
3.

Expected behavior:


Actual behavior:


Screenshot (if applicable):


Browser/Device information:


Thank you.
    `);
    window.location.href = `mailto:kareem.alihamza@concentrix.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-teal mb-4 shadow-glow-teal">
          <FileQuestion className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Help & Support</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Get assistance with the EEC application</p>
      </div>

      {/* Developer Info Card */}
      <div className="glass-card bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white shadow-lg">
            <Code className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Developer Information</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Primary developer and support contact</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
            <User className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Developer Name</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Kareem Ali Hamza</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
            <Mail className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Contact Email</p>
              <a
                href="mailto:kareem.alihamza@concentrix.com"
                className="text-sm font-semibold text-teal-600 dark:text-teal-400 hover:underline"
              >
                kareem.alihamza@concentrix.com
              </a>
            </div>
            <a
              href="mailto:kareem.alihamza@concentrix.com"
              className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          Quick Actions
        </h2>

        <div className="space-y-3">
          <button
            onClick={handleReportIssue}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-white dark:from-teal-900/20 dark:to-gray-800 rounded-xl border border-teal-200 dark:border-teal-800 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Mail className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Report an Issue</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Send an email with details about the bug or problem</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
          </button>

          <a
            href="mailto:kareem.alihamza@concentrix.com?subject=EEC%20Feature%20Request"
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Request a Feature</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Suggest improvements or new functionality</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
          </a>
        </div>
      </div>

      {/* Documentation Links */}
      <div className="glass-card bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick References</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Application Version</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">v1.0.0</p>
          </div>
          <div className="p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Last Updated</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
