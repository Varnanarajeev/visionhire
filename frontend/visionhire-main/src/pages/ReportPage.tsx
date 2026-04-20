import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Download,
  Loader2,
  Home,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Report {
  overall_score: number;
  performance_summary: string;
  strengths: string[];
  weaknesses: string[];
  verdict: string;
}

export default function ReportPage() {
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    const interviewId = localStorage.getItem('interviewId');
    if (!interviewId) {
      navigate('/entry');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('interview_id', interviewId)
        .maybeSingle();

      if (error) throw error;
      if (data) setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getVerdictConfig = (verdict: string) => {
    switch (verdict) {
      case 'pass':
        return {
          label: 'Passed',
          color: 'emerald',
          icon: CheckCircle,
          bg: 'bg-emerald-100',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
        };
      case 'average':
        return {
          label: 'Average Performance',
          color: 'amber',
          icon: TrendingUp,
          bg: 'bg-amber-100',
          text: 'text-amber-700',
          border: 'border-amber-200',
        };
      default:
        return {
          label: 'Needs Improvement',
          color: 'orange',
          icon: AlertCircle,
          bg: 'bg-orange-100',
          text: 'text-orange-700',
          border: 'border-orange-200',
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Report not found</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const verdictConfig = getVerdictConfig(report.verdict);
  const VerdictIcon = verdictConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-4">
            <Award className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Interview Report</h1>
          <p className="text-slate-600">AI-Generated Performance Analysis</p>
        </div>

        <div className="grid gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Overall Performance</h2>
              <div className="text-right">
                <div className="text-4xl font-bold text-blue-600">{report.overall_score}%</div>
                <div className="text-sm text-slate-600">Overall Score</div>
              </div>
            </div>

            <div className="mb-6">
              <div className="w-full bg-slate-200 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-4 rounded-full transition-all duration-1000"
                  style={{ width: `${report.overall_score}%` }}
                />
              </div>
            </div>

            <div className={`${verdictConfig.bg} ${verdictConfig.border} border rounded-lg p-4 flex items-center space-x-3`}>
              <VerdictIcon className={`w-6 h-6 ${verdictConfig.text}`} />
              <div>
                <p className={`font-semibold ${verdictConfig.text}`}>{verdictConfig.label}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Summary</h2>
            <p className="text-slate-700 leading-relaxed">{report.performance_summary}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Strengths</h3>
              </div>
              <ul className="space-y-3">
                {report.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Areas for Improvement</h3>
              </div>
              <ul className="space-y-3">
                {report.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl shadow-xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Next Steps</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Review the areas for improvement and work on strengthening those skills</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Practice similar technical questions to build confidence</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Consider taking another practice interview to track your progress</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-white text-slate-700 py-3 px-6 rounded-lg font-semibold hover:bg-slate-50 transition-all shadow-md flex items-center justify-center"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
}
