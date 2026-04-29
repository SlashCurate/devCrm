import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";
import { BarChart3, Award } from "lucide-react";
import { Result } from "../../types";

const gradeColors: Record<string, string> = {
  "A+": "bg-green-100 text-green-700 border-green-300",
  "A":  "bg-green-50  text-green-600 border-green-200",
  "B+": "bg-blue-100  text-blue-700  border-blue-300",
  "B":  "bg-blue-50   text-blue-600  border-blue-200",
  "C":  "bg-yellow-100 text-yellow-700 border-yellow-300",
  "D":  "bg-orange-100 text-orange-700 border-orange-300",
  "F":  "bg-red-100   text-red-700   border-red-300",
};

export default function StudentResults() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/student/results").then((r) => {
      setResults(r.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const totalMarks   = results.reduce((s, r) => s + (r.exam?.max_marks || 0), 0);
  const obtainedMarks = results.reduce((s, r) => s + r.marks_obtained, 0);
  const percentage   = totalMarks > 0
    ? ((obtainedMarks / totalMarks) * 100).toFixed(1)
    : "0.0";

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <PageHeader
        title="My Results"
        subtitle="View your published exam results"
      />

      {/* Summary Card */}
      {results.length > 0 && (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card text-center">
            <BarChart3 className="w-7 h-7 text-primary-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{percentage}%</p>
            <p className="text-sm text-gray-500">Overall Percentage</p>
          </div>
          <div className="card text-center">
            <Award className="w-7 h-7 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {obtainedMarks}/{totalMarks}
            </p>
            <p className="text-sm text-gray-500">Total Marks</p>
          </div>
          <div className="card text-center">
            <BarChart3 className="w-7 h-7 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {results.filter(
                (r) => r.marks_obtained >= (r.exam?.pass_marks || 0)
              ).length}
              /{results.length}
            </p>
            <p className="text-sm text-gray-500">Exams Passed</p>
          </div>
        </div>
      )}

      {/* Results List */}
      {results.length === 0 ? (
        <div className="card text-center py-16">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 font-medium">No results published yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Results will appear here once published by the Registrar
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((r) => {
            const pct = r.exam
              ? ((r.marks_obtained / r.exam.max_marks) * 100).toFixed(1)
              : "0";
            const passed = r.exam
              ? r.marks_obtained >= r.exam.pass_marks
              : false;
            return (
              <div key={r.id}
                className="card hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center
                                sm:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`px-4 py-2 rounded-xl border-2 text-center
                                    min-w-16 ${(r.grade && gradeColors[r.grade]) || "bg-gray-100"}`}>
                      <p className="text-2xl font-bold">{r.grade}</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {r.exam?.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {r.exam?.program?.name} • Semester {r.exam?.semester?.semester_number || r.exam?.semester_id}
                        {r.subject?.name && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                            {r.subject.name}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {r.exam?.exam_date
                          ? new Date(r.exam.exam_date).toLocaleDateString()
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {r.marks_obtained}
                      <span className="text-base text-gray-400">
                        /{r.exam?.max_marks}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500">{pct}%</p>
                    <span className={passed ? "badge-success" : "badge-danger"}>
                      {passed ? "PASSED" : "FAILED"}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        passed ? "bg-green-500" : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(Number(pct), 100)}%` }}
                    />
                  </div>
                </div>

                {r.remarks && (
                  <p className="mt-3 text-sm text-gray-500 italic">
                    💬 {r.remarks}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}